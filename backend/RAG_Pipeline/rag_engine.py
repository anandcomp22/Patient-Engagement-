"""
RAG pipeline optimized to use Qwen2.5-3B-Instruct as the LLM (sized for ~3B class GPUs).
Features:
- Chunking, dedupe, batched embedding & add to ChromaDB
- Parallel retrieval (medicines + patient summaries)
- Auto medicine suggestion immediately after summary storage
- Final answer generation with safe fallback
- Structured prescription-style JSON output option
- FastAPI endpoints for appointment, transcript store, search, and ingestion

- Run: uvicorn qwen_rag:app --host 0.0.0.0 --port 9000 --reload
"""

import os
import uuid
import json
import json
from json.decoder import JSONDecodeError
from datetime import datetime
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM

import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from dotenv import load_dotenv
from pymongo import MongoClient

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from transformers import AutoTokenizer, AutoModelForCausalLM
import qwen_tokenizer


from transformers import AutoTokenizer, pipeline

load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "medicines")
PATIENT_COLLECTION = os.getenv("PATIENT_COLLECTION", "patient_summaries")

# Embedding model (retrieval-optimized)
EMBEDDING_MODEL = "cambridgeltl/SapBERT-from-PubMedBERT-fulltext"

# -----------------------------
# DBs & clients
# -----------------------------
mongo = MongoClient(MONGO_URI)
db = mongo.get_database("aidme")
sessions = db.sessions
patients = db.patients

chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name=EMBEDDING_MODEL,
    device="cuda" if torch.cuda.is_available() else "cpu",
)


# --- debug: confirm embedding model/device/dimensions ---
print("EMBEDDING_MODEL:", EMBEDDING_MODEL)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("DEVICE:", DEVICE)

# run a tiny sample embed to confirm dimension (wrapped in try/except to avoid crashing)
try:
    sample_emb = embedding_fn(["test"])
    if isinstance(sample_emb, list) and len(sample_emb) > 0:
        print("Sample embedding length:", len(sample_emb[0]))
        print("Sample embedding vector (first 6 values):", sample_emb[0][:6])
    else:
        print("Sample embedding returned unexpected shape/type:", type(sample_emb))
except Exception as e:
    print("Embedding debug sample failed:", e)
# --- end debug ---


# create or get collections
def get_or_create_collection(name: str):
    """
    Always attach the correct embedding function (SapBERT 768d).
    If collection exists, delete and recreate with SapBERT.
    """
    try:
        chroma_client.delete_collection(name)
    except:
        pass

    return chroma_client.create_collection(
        name=name,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )


med_collection = get_or_create_collection(COLLECTION_NAME)
patient_collection = get_or_create_collection(PATIENT_COLLECTION)

# -----------------------------
# Load tokenizer & LLM
# -----------------------------
LLM_MODEL = "Qwen/Qwen2.5-3B-Instruct"

print("Loading tokenizer…")
tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL, use_fast=True, trust_remote_code=True)

print("Loading model with accelerate/device_map='auto'…")
model = AutoModelForCausalLM.from_pretrained(
    LLM_MODEL,
    device_map="auto", 
    trust_remote_code=True
)

print("Building llm_pipe (no device argument)…")

# Qwen text-generation pipeline (instruction-following)
llm_pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=256,
    pad_token_id=tokenizer.eos_token_id,
    temperature=0.2,
    repetition_penalty=1.1,
    do_sample=False,
)

# smaller extraction pipeline (can reuse llm_pipe if memory tight)
extract_pipe = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=120,
    pad_token_id=tokenizer.eos_token_id,
)

# -----------------------------
# Retrieval helpers (parallel)
# -----------------------------
def extract_keywords(summary_text: str) -> Dict[str, List[str]]:
    """
    Extract medical keywords from patient summary using structured JSON output.
    Returns: {
        "diseases": [...],
        "symptoms": [...],
        "medicines": [...],
        "tests": [...]
    }
    """

    if not summary_text or not summary_text.strip():
        return {"diseases": [], "symptoms": [], "medicines": [], "tests": []}

    prompt = f"""
You are a medical keyword extraction system.
From the following clinical summary, extract keywords in FOUR categories:
1. diseases/conditions  
2. symptoms  
3. medicines/drugs  
4. lab tests/investigations  

Return STRICT JSON ONLY. No explanation.

Summary:
\"\"\"{summary_text}\"\"\"

JSON format:
{{
  "diseases": [],
  "symptoms": [],
  "medicines": [],
  "tests": []
}}
    """

    try:
        raw = extract_pipe(prompt)[0]["generated_text"]
    except Exception:
        raw = "{}"

    # ---- Parse JSON safely ----
    import json
    try:
        data = json.loads(raw)
    except:
        # fallback
        data = {"diseases": [], "symptoms": [], "medicines": [], "tests": []}

    # ---- Normalize + Clean ----
    def clean_list(items):
        cleaned = []
        for x in items:
            x = x.lower().strip()
            if not x:
                continue
            if x in ["none", "-", "nil"]:
                continue
            cleaned.append(x)
        # remove duplicates but keep order
        return list(dict.fromkeys(cleaned))

    return {
        "diseases": clean_list(data.get("diseases", []))[:10],
        "symptoms": clean_list(data.get("symptoms", []))[:12],
        "medicines": clean_list(data.get("medicines", []))[:10],
        "tests": clean_list(data.get("tests", []))[:10],
    }



# -----------------------------
# RETRIEVE MEDICINE DOCS
# -----------------------------
def retrieve_medicine_docs(keywords: list, n_results: int = 5):
    """
    Retrieve medicine documents related to the given keywords.
    keywords → ["fever", "pain"] etc.
    """

    if not keywords:
        return [], []

    query_text = " ".join(keywords)

    # Convert to embedding
    query_emb = embedding_fn([query_text])

    # Search medicines collection
    results = med_collection.query(
        query_embeddings=query_emb,
        n_results=n_results,
        include=["documents", "metadatas"]
    )

    docs = results.get("documents", [[]])[0]
    meta = results.get("metadatas", [[]])[0]

    return docs, meta


def reset_chroma_collections():
    for name in [COLLECTION_NAME, PATIENT_COLLECTION]:
        try:
            chroma_client.delete_collection(name)
            print(f"Deleted Chroma collection: {name}")
        except Exception:
            print(f"No collection {name} to delete or error.")
    # Recreate empty collections
    get_or_create_collection(COLLECTION_NAME)
    get_or_create_collection(PATIENT_COLLECTION)

def query_collection(collection, query_text: str, top_k: int = 5, filter: dict = None):
    """
    Query a Chroma collection safely.
    Args:
        collection: Chroma collection object
        query_text: text query
        top_k: number of results
        filter: optional dict for metadata filtering (e.g., {"patient_id": "123"})
    Returns:
        dict with 'documents' and 'metadatas' keys
    """
    if not query_text or not query_text.strip():
        return {"documents": [], "metadatas": []}
    
    try:
        query_emb = embedding_fn([query_text])
        res = collection.query(
            query_embeddings=query_emb,
            n_results=top_k,
            where=filter  # filter by metadata if provided
        )
        docs = res.get("documents", [[]])
        metas = res.get("metadatas", [[]])
        return {
            "documents": docs[0] if docs else [],
            "metadatas": metas[0] if metas else []
        }
    except Exception as e:
        print(f"[query_collection error]: {e}")
        return {"documents": [], "metadatas": []}

def retrieve_parallel(patient_id: str, keywords: list, top_k: int = 5):
    """
    Retrieve medications and patient history in parallel, safely.
    """
    query_text = " ".join(keywords) if keywords else " "

    results = {}
    tasks = {
        "med": (med_collection, query_text, top_k, None),
        "hist": (patient_collection, " ", top_k, {"patient_id": patient_id})
    }
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_to_key = {
            executor.submit(query_collection, *args): key for key, args in tasks.items()
        }
        for future in as_completed(future_to_key):
            key = future_to_key[future]
            try:
                results[key] = future.result()
            except Exception as e:
                print(f"[retrieve_parallel error] {key}: {e}")
                results[key] = {"documents": [], "metadatas": []}
    
    return results.get("med"), results.get("hist")


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

# -----------------------------
# Prescription extraction & safe output
# -----------------------------
def extract_structured_suggestions(context: str, summary: str):
    """
    Use LLM to return structured prescription suggestions safely.
    """
    prompt = f"""
    You are a medical assistant. Use ONLY the context and summary.
    Return STRICT JSON with keys:
    - suggestions: list of objects with fields medicine, dose, frequency, substitutes, side_effects, provenance
    - note: string (short clinical note)
    
    Context: {context}
    Summary: {summary}
    
    If no prescription info, return suggestions: [] and a safe note.
    """
    
    try:
        raw_output = llm_pipe(prompt, max_new_tokens=256)[0]["generated_text"].strip()
        
        # Attempt to extract JSON safely
        json_start = raw_output.find("{")
        json_end = raw_output.rfind("}") + 1
        json_text = raw_output[json_start:json_end] if json_start != -1 and json_end != -1 else raw_output
        
        # Parse JSON
        parsed = json.loads(json_text)
        
        # Ensure keys exist
        if "suggestions" not in parsed:
            parsed["suggestions"] = []
        if "note" not in parsed:
            parsed["note"] = "No suggestions available."
        
    except (JSONDecodeError, ValueError):
        # fallback safe output
        parsed = {
            "suggestions": [],
            "note": "Not available in RAG. Recommend patient consult a clinician."
        }
    
    return parsed

# ----------------------------
# MAIN PIPELINE: Called by API
# ----------------------------


from transformers import GPT2TokenizerFast

tokenizer = GPT2TokenizerFast.from_pretrained("gpt2")  # lightweight tokenizer

def chunk_text(text, max_tokens=500):
    """
    Split text into chunks <= max_tokens using GPT2 tokenizer
    """
    tokens = tokenizer.encode(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i+max_tokens]
        chunk_text = tokenizer.decode(chunk_tokens)
        chunks.append(chunk_text)
    return chunks

def summarize_transcript(raw_transcript):
    chunks = chunk_text(raw_transcript, max_tokens=500)
    summaries = []

    for chunk in chunks:
        prompt = f"Give short clinical summary of the following:\n\n{chunk}\n\nSummary:"
        try:
            out = llm_pipe(prompt, max_new_tokens=128)[0]["generated_text"].strip()
            summaries.append(out)
        except Exception as e:
            print(f"[summarize_transcript error]: {e}")
    
    # Combine summaries into one final summary
    final_summary = " ".join(summaries)
    return final_summary


def store_summary_and_run_rag(session_id: str, raw_transcript: str):
    """Called by /transcript/store automatically"""

    # Summarize Transcript
    summary = summarize_transcript(raw_transcript)

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

    structured = extract_structured_suggestions(context, summary)

    # Save system RAG output in Mongo
    sessions.update_one(
        {"_id": session_id},
        {"$push": {"qa": {"q": "__auto__", "a": structured, "time": datetime.utcnow()}}}
    )

    return summary, structured


def run_llm(prompt):
    out = llm_pipe(prompt)

    # If out is tuple -> take first element
    if isinstance(out, tuple):
        out = out[0]

    # If out is dict -> extract text
    if isinstance(out, dict) and "generated_text" in out:
        out = out["generated_text"]

    # Ensure string
    return str(out).strip()


def answer_question(session_id: str, question: str):
    """
    Answer a question using RAG + summary context.
    """
    s = sessions.find_one({"_id": session_id})
    if not s:
        return {"answer": "Session not found", "structured": None}
    
    summary = s.get("summary", "")
    pid = s.get("patient_id")
    
    # Extract keywords
    keywords = extract_keywords(summary)
    med_data, hist_data = retrieve_parallel(pid, keywords)
    
    # Build context
    context = build_context(med_data, hist_data)
    if not context:
        return {"answer": "Not available in RAG.", "structured": None}
    
    # Construct prompt
    prompt = f"""
    Use ONLY the context + summary. If answer not found → "Not available in RAG".
    
    Context: {context}
    Summary: {summary}
    Question: {question}
    """
    
    try:
        # Use llm_pipe (not undefined llm)
        out = run_llm(prompt)
    except Exception as e:
        print(f"[answer_question error]: {e}")
        out = "Error generating answer. Try again later."
    
    # Store in Mongo
    try:
        sessions.update_one(
            {"_id": session_id},
            {"$push": {"qa": {"q": question, "a": out, "time": datetime.utcnow()}}}
        )
    except Exception as e:
        print(f"[Mongo update error]: {e}")
    
    return {"answer": out, "structured": None}
