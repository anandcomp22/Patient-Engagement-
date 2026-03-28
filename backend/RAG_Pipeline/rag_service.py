"""
rag_service.py  — Ollama-powered RAG backend
==============================================
LLM  : Ollama llama3.2:latest  (must be running: `ollama serve`)
VecDB: ChromaDB (persistent)
MeDB : MongoDB (sessions, patients)

Exports used by rag_api.py and transcription_server.py:
  - sessions                  (pymongo collection)
  - extract_keywords(text)    -> list[str]
  - retrieve_medicine_docs(keywords, top_k) -> (docs, metas)
  - create_summary_and_store(session_id, raw_text) -> str (summary)
  - final_answer(session_id, question) -> (answer, keywords, med_docs, med_metas)
"""

import os
import uuid
import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from pymongo import MongoClient
from langchain_ollama import OllamaLLM

# ──────────────────────────────────────────────────────────────
# 0. Silence HuggingFace telemetry (no HF usage but avoids noise)
# ──────────────────────────────────────────────────────────────
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["ANONYMIZED_TELEMETRY"] = "False"

load_dotenv()


# ──────────────────────────────────────────────────────────────
# 1. MongoDB
# ──────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

_mongo = MongoClient(MONGO_URI)
_db = _mongo.aidme

sessions = _db.sessions
patients = _db.patients


# ──────────────────────────────────────────────────────────────
# 2. ChromaDB
# ──────────────────────────────────────────────────────────────
CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "C:/Users/morea/chroma_db")

_chroma = chromadb.PersistentClient(path=CHROMA_DIR)

_embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-mpnet-base-v2"
)


def _get_or_create(name: str):
    """Get or create a ChromaDB collection, safely."""
    try:
        return _chroma.get_collection(name=name, embedding_function=_embedding_fn)
    except Exception:
        return _chroma.create_collection(name=name, embedding_function=_embedding_fn)


med_collection_main     = _get_or_create("medicines_main")
med_collection_detailed = _get_or_create("medicines_detailed")
patient_collection      = _get_or_create("patient_summaries")


# ──────────────────────────────────────────────────────────────
# 3. Ollama LLM  (llama3.2 — fastest local model)
# ──────────────────────────────────────────────────────────────
llm = OllamaLLM(
    model="llama3.2:latest",
    temperature=0,
    num_predict=150,       # short = fast; enough for list answers
    repeat_penalty=1.1,
    top_p=0.9,
    stop=["\n\n", "</s>"]  # stop early once the answer is done
)

# Shared thread pool for parallel LLM / retrieval calls
_pool = ThreadPoolExecutor(max_workers=4)


# ──────────────────────────────────────────────────────────────
# 4. Small helpers
# ──────────────────────────────────────────────────────────────

def _truncate(text: str, max_words: int = 400) -> str:
    """Truncate text to max_words words to keep prompts small."""
    words = text.split()
    return " ".join(words[:max_words]) if len(words) > max_words else text


def _clean_summary(text: str) -> str:
    """Strip common LLM preamble from summaries."""
    text = text.strip()
    text = re.sub(r"(?i)(here is.*?:|summary.*?:|final summary.*?:)", "", text)
    return re.sub(r"\s+", " ", text).strip()


# ──────────────────────────────────────────────────────────────
# 5. Keyword Extraction  (Ollama-powered)
# ──────────────────────────────────────────────────────────────

def extract_keywords(text: str) -> list:
    """
    Extract medical symptom/disease keywords from text using Ollama.
    Returns a deduplicated list of ≤10 lowercase keyword strings.
    """
    if not text or len(text.strip().split()) < 3:
        return []

    prompt = f"""Extract ONLY the disease and symptom keywords that are EXPLICITLY MENTIONED in the text below. Do NOT add related symptoms or diseases that are not present in the text.

Rules:
- comma separated only
- lowercase only
- max 10 keywords
- no sentences, no explanations
- ONLY use words found in the text

Text:
{_truncate(text, 300)}

Output:"""

    try:
        output = llm.invoke(prompt)
    except Exception as e:
        print(f"[extract_keywords] Ollama error: {e}")
        return []

    output = output.lower()
    
    # Filter out common LLM refusals/conversational filler
    if "no text" in output or "cannot" in output or "provide the text" in output or "i am sorry" in output:
        return []

    output = re.sub(r"[^a-z, ]", "", output)

    keywords = []
    for k in output.split(","):
        k = k.strip()
        # Ensure it is an actual keyword (not a whole sentence, max 4 words, < 40 chars)
        if 2 < len(k) < 40 and len(k.split()) <= 4:
            if k not in keywords:
                keywords.append(k)

    print("KEYWORDS:", keywords[:10])
    return keywords[:10]


# ──────────────────────────────────────────────────────────────
# 6. Medicine Retrieval  (ChromaDB)
# ──────────────────────────────────────────────────────────────

def retrieve_medicine_docs(keywords: list, top_k: int = 5):
    """
    Query medicines_main ChromaDB collection for the given keyword list.
    Returns (docs, metas) with duplicates removed by drug_name.
    """
    if not keywords:
        return [], []

    query = "patient has " + ", ".join(keywords)
    print("MEDICINE QUERY:", query)

    # Never request more results than exist in the collection
    collection_size = med_collection_main.count()
    if collection_size == 0:
        print("WARNING: medicines_main is empty — run medicines_loader.py first")
        return [], []

    fetch_k = min(top_k * 3, 30, collection_size)

    try:
        results = med_collection_main.query(
            query_texts=[query],
            n_results=fetch_k
        )
    except Exception as e:
        print(f"[retrieve_medicine_docs] ChromaDB query failed ({e}), retrying n_results=1")
        try:
            results = med_collection_main.query(query_texts=[query], n_results=1)
        except Exception:
            return [], []

    all_docs  = results.get("documents", [[]])[0]
    all_metas = results.get("metadatas", [[]])[0]

    # Deduplicate by drug_name — keep highest-similarity result
    seen      = set()
    out_docs  = []
    out_metas = []

    for doc, meta in zip(all_docs, all_metas):
        drug = meta.get("drug_name", "").strip()
        if drug and drug not in seen:
            seen.add(drug)
            out_docs.append(doc)
            out_metas.append(meta)
        if len(out_docs) >= top_k:
            break

    print("MEDICINES FOUND:", [m.get("drug_name") for m in out_metas])
    return out_docs, out_metas


def generate_prescription_guidelines(medications: list) -> list:
    """
    Use Ollama to generate 3-4 professional clinical guidelines for a prescription.
    medications: list of dicts with {name, dosage, frequency, duration}
    """
    if not medications:
        return ["Follow general medical advice.", "Stay hydrated.", "Contact your doctor if symptoms worsen."]

    med_list_str = "\n".join([f"- {m.get('name')} ({m.get('dosage')}, {m.get('frequency')})" for m in medications])

    prompt = f"""You are a clinical pharmacist. Generate 3-4 professional, concise general guidelines for a patient taking the following medications.
Focus on safety, lifestyle advice (e.g. hydration), and when to seek help.

Medications:
{med_list_str}

Output as a simple bulleted list (no header, no markdown bolding, max 15 words per point)."""

    try:
        output = llm.invoke(prompt)
        # Parse bullets
        lines = [line.strip().lstrip("-*• ").strip() for line in output.split("\n") if line.strip()]
        return lines[:4] if lines else ["Follow prescribed dosage strictly."]
    except Exception as e:
        print(f"[generate_prescription_guidelines] Ollama error: {e}")
        return ["Follow prescribed dosage strictly.", "Stay hydrated.", "Consult doctor if allergic reaction occurs."]


def generate_medicine_comments(med_metas: list, context_text: str) -> list:
    """
    Use Ollama to generate a 1-sentence clinical comment for each medicine.
    Returns a list of strings, same length as med_metas.
    """
    if not med_metas or not context_text:
        return ["No comment available."] * len(med_metas)

    drug_names = [m.get("drug_name", "Unknown Medicine") for m in med_metas]
    
    prompt = f"""You are a clinical pharmacist. For each medicine in the list below, write EXACTLY ONE concise sentence (max 15 words) explaining why it is suitable for the patient's symptoms.

Patient Context:
{_truncate(context_text, 150)}

Medicines:
{", ".join(drug_names)}

Output format:
1. [medicine name]: [comment]
2. [medicine name]: [comment]
..."""

    try:
        output = llm.invoke(prompt)
    except Exception as e:
        print(f"[generate_medicine_comments] Ollama error: {e}")
        return ["Suitable for reported symptoms."] * len(med_metas)

    # Simple parsing: extract text after the colon
    comments = []
    lines = [line.strip() for line in output.split("\n") if ":" in line]
    
    for i, name in enumerate(drug_names):
        found = False
        for line in lines:
            if name.lower() in line.lower():
                parts = line.split(":", 1)
                if len(parts) > 1:
                    comments.append(parts[1].strip())
                    found = True
                    break
        if not found:
            comments.append(f"Standard treatment for indicated symptoms.")

    return comments


# ──────────────────────────────────────────────────────────────
# 7. Patient History Retrieval  (ChromaDB)
# ──────────────────────────────────────────────────────────────

def _retrieve_patient_history(patient_id: str, query: str):
    """Retrieve past summaries stored for a patient from ChromaDB."""
    try:
        result = patient_collection.query(
            query_texts=[query],
            n_results=3,
            where={"patient_id": patient_id}
        )
        docs  = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        return docs, metas
    except Exception as e:
        print(f"[_retrieve_patient_history] error: {e}")
        return [], []


# ──────────────────────────────────────────────────────────────
# 8. Summary + Store  (Ollama → ChromaDB + MongoDB)
# ──────────────────────────────────────────────────────────────

def create_summary_and_store(session_id: str, raw_text: str) -> str:
    """
    Summarise the raw transcript with Ollama, store in:
      - ChromaDB patient_summaries collection
      - MongoDB sessions.summary field
    Returns the generated summary string.
    """
    session    = sessions.find_one({"_id": session_id})
    patient_id = session.get("patient_id", "patient_unknown") if session else "patient_unknown"

    prompt = f"""Summarize the following doctor-patient conversation professionally.
Be concise (3-5 sentences). Include symptoms, diagnosis and treatment if mentioned.

Text:
{_truncate(raw_text, 400)}

Summary:"""

    try:
        summary = llm.invoke(prompt)
    except Exception as e:
        print(f"[create_summary_and_store] Ollama error: {e}")
        summary = raw_text[:500]   # fallback: use raw text

    summary = _clean_summary(summary)
    summary = _truncate(summary, 300)

    # --- Store in ChromaDB ---
    try:
        patient_collection.add(
            documents=[summary],
            metadatas=[{"patient_id": patient_id, "session_id": session_id}],
            ids=[str(uuid.uuid4())]
        )
    except Exception as e:
        print(f"[create_summary_and_store] ChromaDB add error: {e}")

    # --- Store in MongoDB ---
    try:
        sessions.update_one(
            {"_id": session_id},
            {"$set": {"summary": summary, "updated_at": datetime.utcnow()}}
        )
    except Exception as e:
        print(f"[create_summary_and_store] MongoDB update error: {e}")

    return summary


# ──────────────────────────────────────────────────────────────
# 9. Final RAG Answer  (parallel retrieval + Ollama answer)
# ──────────────────────────────────────────────────────────────

def final_answer(session_id: str, user_question: str):
    """
    Full RAG pipeline:
      1. Load session context (summary + raw transcript) from MongoDB
      2. Run keyword extraction + patient history retrieval in parallel
      3. Retrieve medicines from ChromaDB
      4. Generate answer with Ollama (hallucination-guarded)
      5. Push Q&A pair to MongoDB session
    Returns: (answer: str, keywords: list, med_docs: list, med_metas: list)
    """
    # --- Load session ---
    session        = sessions.find_one({"_id": session_id})
    summary        = ""
    raw_transcript = ""
    patient_id     = "patient_unknown"

    if session:
        summary    = session.get("summary", "")
        patient_id = session.get("patient_id", "patient_unknown")
        raw_list   = session.get("transcript_raw", [])
        if isinstance(raw_list, list):
            raw_transcript = " ".join(raw_list)
        elif isinstance(raw_list, str):
            raw_transcript = raw_list

    combined_text = " ".join(filter(None, [raw_transcript, summary, user_question]))

    # --- Parallel: keyword extraction + patient history ---
    kw_future   = _pool.submit(extract_keywords, combined_text)
    hist_future = _pool.submit(_retrieve_patient_history, patient_id, user_question)

    keywords              = kw_future.result()
    hist_docs, hist_metas = hist_future.result()

    # --- Medicine retrieval ---
    med_docs, med_metas = retrieve_medicine_docs(keywords)

    if not med_metas:
        answer = "No matching medicines found in database."
        _push_qa(session_id, user_question, answer)
        return answer, keywords, med_docs, med_metas

    # --- Build LLM prompt ---
    drug_list_text  = "\n".join(f"- {m.get('drug_name')}" for m in med_metas if m.get("drug_name"))
    drug_name_set   = {m.get("drug_name", "") for m in med_metas}
    context_summary = summary or raw_transcript

    prompt = f"""You are a clinical decision support assistant.

You MUST ONLY recommend medicines from the list below. Do NOT invent any medicine.

Available Medicines:
{drug_list_text}

Patient Symptoms:
{_truncate(context_summary, 200)}

Question:
{user_question}

Return EXACTLY this format:
Recommended Medicines:
- medicine name

Answer:"""

    try:
        answer = llm.invoke(prompt).strip()
    except Exception as e:
        print(f"[final_answer] Ollama error: {e}")
        answer = ""

    # --- Hallucination guard ---
    # If any Title-case word in the answer is NOT a known drug, fall back to top-3 list
    answer_words = set(answer.split())
    title_words  = {w for w in answer_words if w.istitle() and len(w) > 3}
    hallucinated = title_words - drug_name_set

    if hallucinated or not answer or "can't provide" in answer.lower():
        answer = "Recommended Medicines:\n" + "\n".join(
            f"- {m.get('drug_name')}" for m in med_metas[:3]
        )

    answer = _truncate(answer, 200)

    # --- Persist Q&A ---
    _push_qa(session_id, user_question, answer)

    return answer, keywords, med_docs, med_metas


# ──────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────

def _push_qa(session_id: str, question: str, answer: str):
    """Push a Q&A pair into the session's qa array in MongoDB."""
    try:
        sessions.update_one(
            {"_id": session_id},
            {"$push": {"qa": {"q": question, "a": answer, "time": datetime.utcnow()}}}
        )
    except Exception as e:
        print(f"[_push_qa] MongoDB error: {e}")
