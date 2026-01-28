# rag_pipeline.py
import uuid
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import json
from pymongo import MongoClient
from transformers import AutoTokenizer, pipeline

from chromadb import PersistentClient
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

import os

# ----------------------------
# Basic Config
# ----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
COLLECTION_NAME = "medicines"
PATIENT_COLLECTION = "patient_summaries"

mongo = MongoClient(MONGO_URI)
db = mongo["aidme"]
sessions = db.sessions

# ----------------------------
# Chroma Setup
# ----------------------------
chroma = PersistentClient(path=CHROMA_DIR)
embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/multi-qa-mpnet-base-dot-v1",
    device="cuda"
)

def get_or_create(name):
    try:
        return chroma.get_collection(name, embedding_function=embedding_fn)
    except:
        return chroma.create_collection(name, embedding_function=embedding_fn)

med_collection = get_or_create(COLLECTION_NAME)
patient_collection = get_or_create(PATIENT_COLLECTION)

# ----------------------------
# LLM (Qwen2.5-3B)
# ----------------------------
LLM_MODEL = "Qwen/Qwen2.5-3B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL)
llm = pipeline("text-generation", model=LLM_MODEL, device=0, max_new_tokens=256)

extractor_llm = pipeline("text-generation", model=LLM_MODEL, device=0, max_new_tokens=120)


# ----------------------------
# Helper Functions
# ----------------------------
def extract_keywords(summary: str):
    if not summary.strip():
        return []

    prompt = f"""
Extract keywords (diseases, symptoms, medicines, tests).
Return comma-separated.

Summary:
{summary}
"""

    out = extractor_llm(prompt)[0]["generated_text"]
    parts = [p.strip() for p in out.replace("\n", ",").split(",") if p.strip()]
    return parts[:12]


def retrieve_parallel(patient_id, keywords, top_k=5):
    query = " ".join(keywords) if keywords else "patient"

    def get_meds():
        res = med_collection.query(query_texts=[query], n_results=top_k)
        return res.get("documents", [[]])[0], res.get("metadatas", [[]])[0]

    def get_history():
        res = patient_collection.query(
            query_texts=["medical"],
            where={"patient_id": patient_id},
            n_results=top_k
        )
        return res.get("documents", [[]])[0], res.get("metadatas", [[]])[0]

    with ThreadPoolExecutor(max_workers=2) as ex:
        med_f = ex.submit(get_meds)
        hist_f = ex.submit(get_history)
        meds = med_f.result()
        hist = hist_f.result()

    return meds, hist


def build_context(meds, hist):
    docs_med, meta_med = meds
    docs_hist, _ = hist

    c = ""

    if docs_hist:
        c += "Patient History:\n" + "\n\n".join(docs_hist) + "\n\n"

    if docs_med:
        c += "Medicine Info:\n"
        for d, m in zip(docs_med, meta_med):
            snip = m.get("_snippet", "") if isinstance(m, dict) else ""
            c += f"{snip}\n{d}\n\n"

    return c.strip()


def structured_prescription(context, summary):
    prompt = f"""
Use ONLY context + summary.
Return JSON:

{{
  "suggestions": [
    {{
      "medicine": "",
      "dose": "",
      "frequency": "",
      "notes": ""
    }}
  ],
  "note": ""
}}

If info missing → suggestions empty + short safe note.

Context:
{context}

Summary:
{summary}
"""

    out = llm(prompt)[0]["generated_text"].strip()

    try:
        st = out[out.find("{"):out.rfind("}")+1]
        return json.loads(st)
    except:
        return {
            "suggestions": [],
            "note": "Not available in RAG. Consult a physician."
        }


# ----------------------------
# MAIN PIPELINE: Called by API
# ----------------------------
def store_summary_and_run_rag(session_id: str, raw_transcript: str):
    """Called by /transcript/store automatically"""

    # Summarize Transcript
    sum_prompt = f"Give short clinical summary:\n\n{raw_transcript}\n\nSummary:"
    summary = llm(sum_prompt)[0]["generated_text"].strip()

    # Store summary in session
    sessions.update_one({"_id": session_id}, {"$set": {"summary": summary}})

    # Store in patient history vectorDB
    s = sessions.find_one({"_id": session_id})
    pid = s["patient_id"]

    patient_collection.add(
        documents=[summary],
        metadatas=[{"patient_id": pid, "session_id": session_id}],
        ids=[str(uuid.uuid4())]
    )

    # --- Auto RAG ---
    keywords = extract_keywords(summary)
    med_data, hist_data = retrieve_parallel(pid, keywords)

    context = build_context(med_data, hist_data)

    structured = structured_prescription(context, summary)

    # Save system RAG output in Mongo
    sessions.update_one(
        {"_id": session_id},
        {"$push": {"qa": {"q": "__auto__", "a": structured, "time": datetime.utcnow()}}}
    )

    return summary, structured


def answer_question(session_id: str, question: str):
    """Called by /final_answer"""

    s = sessions.find_one({"_id": session_id})
    if not s:
        return "Session not found"

    summary = s.get("summary", "")
    pid = s["patient_id"]

    keywords = extract_keywords(summary)
    med_data, hist_data = retrieve_parallel(pid, keywords)

    context = build_context(med_data, hist_data)
    if not context:
        return {"answer": "Not available in RAG.", "structured": None}

    prompt = f"""
Use ONLY the context + summary.
If answer not found → "Not available in RAG".

Context:
{context}

Summary:
{summary}

Question:
{question}
"""

    out = llm(prompt)[0]["generated_text"].strip()

    # Store in Mongo
    sessions.update_one(
        {"_id": session_id},
        {"$push": {"qa": {"q": question, "a": out, "time": datetime.utcnow()}}}
    )

    return {"answer": out}
