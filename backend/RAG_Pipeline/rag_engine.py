import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from pymongo import MongoClient

from transformers import pipeline, AutoTokenizer

load_dotenv()

# ------------------------------------------------------------
# 1. MongoDB setup
# ------------------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.aidme
sessions = db.sessions
patients = db.patients

# ------------------------------------------------------------
# 2. ChromaDB setup
# ------------------------------------------------------------
CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-mpnet-base-v2",
    device="cuda"
)

def load_or_create_collection(name):
    try:
        return chroma_client.get_collection(name, embedding_function=embedding_fn)
    except:
        return chroma_client.create_collection(name, embedding_function=embedding_fn)

med_collection = load_or_create_collection("medicines")
patient_collection = load_or_create_collection("patient_summaries")

# ------------------------------------------------------------
# 3. LLM Models (GPU enabled)
# ------------------------------------------------------------
MODEL = "google/flan-t5-small"

tokenizer = AutoTokenizer.from_pretrained(MODEL)

keyword_pipe = pipeline(
    "text2text-generation",
    model=MODEL,
    max_new_tokens=80,
    device=0     # GPU
)

final_pipe = pipeline(
    "text2text-generation",
    model=MODEL,
    max_new_tokens=250,
    device=0     # GPU
)

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def truncate_text_by_tokens(text, max_tokens=512):
    tokens = tokenizer.encode(text, truncation=True, max_length=max_tokens)
    return tokenizer.decode(tokens, skip_special_tokens=True)

def extract_keywords_from_summary(text):
    if not text.strip():
        return []
    prompt = f"""
Extract ONLY medical keywords.
Return comma-separated disease, symptoms, medicines.

Summary:
{text}
"""
    res = keyword_pipe(prompt)[0]["generated_text"]
    return [k.strip() for k in res.split(",") if k.strip()]

def retrieve_medicine_docs(keywords, top_k=5):
    if not keywords:
        return [], []
    query = " ".join(keywords)
    results = med_collection.query(query_texts=[query], n_results=top_k)
    return results["documents"][0], results["metadatas"][0]

def retrieve_patient_history(patient_id, top_k=5):
    results = patient_collection.query(
        query_texts=[" "],
        n_results=top_k,
        where={"patient_id": patient_id}
    )
    return results["documents"][0], results["metadatas"][0]

# ------------------------------------------------------------
# Store Summary
# ------------------------------------------------------------
def create_summary_and_store(session_id, raw_text):
    summary = truncate_text_by_tokens(raw_text)

    s = sessions.find_one({"_id": session_id})
    if not s:
        raise Exception("Session not found")

    patient_id = s["patient_id"]

    patient_collection.add(
        documents=[summary],
        metadatas=[{"patient_id": patient_id}],
        ids=[str(uuid.uuid4())]
    )

    sessions.update_one({"_id": session_id}, {"$set": {"summary": summary}})

    return summary

# ------------------------------------------------------------
# Generate RAG Answer
# ------------------------------------------------------------
def final_answer(session_id, user_question):
    s = sessions.find_one({"_id": session_id})
    if not s:
        raise Exception("Session not found")

    summary = s.get("summary", "")
    patient_id = s["patient_id"]

    keywords = extract_keywords_from_summary(summary)
    med_docs, _ = retrieve_medicine_docs(keywords)
    hist_docs, _ = retrieve_patient_history(patient_id)

    context = ""
    if hist_docs:
        context += "Patient History:\n" + "\n\n".join(hist_docs) + "\n\n"
    if med_docs:
        context += "Medicine Info:\n" + "\n\n".join(med_docs) + "\n\n"

    context = truncate_text_by_tokens(context, max_tokens=300)

    prompt = f"""
You are a medical assistant AI.
Use ONLY the provided context.
If answer not present, respond: "Not available in RAG".

Context:
{context}

Summary:
{summary}

Question:
{user_question}
"""

    out = final_pipe(prompt)[0]["generated_text"]

    sessions.update_one(
        {"_id": session_id},
        {
            "$push": {
                "qa": {"q": user_question, "a": out, "time": datetime.utcnow()}
            }
        }
    )
    return out
