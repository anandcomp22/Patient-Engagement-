"""
Ingest ALL CSV files from a `dataset/` folder into a ChromaDB collection named "medicines".
- Reads every CSV in dataset/
- Normalizes & cleans rows
- Flattens all columns into a searchable document text (with structure)
- Keeps every original column as metadata (stringified)
- Splits long documents into overlapping chunks for better retrieval
- Deduplicates identical chunks
- Uses a retrieval-optimized default embedding model (configurable)
- Adds data in batches for speed/stability
- Writes an ingest-map CSV for traceability

Place this script next to your `dataset/` folder and run:
    python medicines_loader.py
"""

import os
import csv
import uuid
import hashlib
import json
from typing import List, Dict
from dotenv import load_dotenv

import pandas as pd
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
import torch


load_dotenv()

# ---------- CONFIG ----------
CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
DATASET_DIR = os.getenv("DATASET_DIR", "./dataset")  # folder containing med1.csv, med2.csv, etc.
COLLECTION_NAME = "medicines"
PATIENT_COLLECTION = "patient_summaries"

# Choose embedding model:
# - Retrieval-optimized (default): "sentence-transformers/multi-qa-mpnet-base-dot-v1"
# - High-quality general embed: "sentence-transformers/all-mpnet-base-v2"
# - Lightweight for prototypes: "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_MODEL = "cambridgeltl/SapBERT-from-PubMedBERT-fulltext"
DEVICE = os.getenv("EMBEDDING_DEVICE", "cuda" if torch.cuda.is_available() else "cpu")

# Chunking settings (characters)
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "900"))      # ~900 chars per chunk
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))  # overlap between chunks

# Batching
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "256"))

# ----------------------------

def find_csv_files(folder: str) -> List[str]:
    files = []
    for root, _, filenames in os.walk(folder):
        for fn in filenames:
            if fn.lower().endswith(".csv"):
                files.append(os.path.join(root, fn))
    return sorted(files)

def safe_str(x):
    if pd.isna(x):
        return ""
    if isinstance(x, (dict, list)):
        return json.dumps(x, ensure_ascii=False)
    return str(x)

def build_doc_from_row(row: Dict[str, any]) -> str:
    """
    Build a structured text block from all columns in the row.
    Keeps order: ColumnName: value
    """
    parts = []
    for col, val in row.items():
        v = safe_str(val).strip()
        if v != "":
            parts.append(f"{col}: {v}")
    return "\n".join(parts).strip()

def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    if not text:
        return []
    chunks = []
    start = 0
    length = len(text)
    if length <= chunk_size:
        return [text]
    while start < length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= length:
            break
        start = end - overlap
    return chunks

def text_fingerprint(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()

def normalize_metadata(row: Dict[str, any], source_file: str, row_index: int) -> Dict[str, str]:
    md = {str(k): safe_str(v) for k, v in row.items()}
    md["_source_file"] = source_file
    md["_row_index"] = str(row_index)
    return md

def ensure_collection(client, COLLECTION_NAME, embedding_fn):
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"Deleted existing collection '{COLLECTION_NAME}'.")
    except Exception:
        print(f"No pre-existing collection named '{COLLECTION_NAME}' or delete failed — creating new one.")
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"}
    )
    return collection


def load_and_ingest():
    # init client & embedding function
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name=EMBEDDING_MODEL,
    device="cuda" if torch.cuda.is_available() else "cpu"
)


    collection = ensure_collection(client, COLLECTION_NAME, embedding_fn)

    csv_files = find_csv_files(DATASET_DIR)
    if not csv_files:
        raise SystemExit(f"No CSV files found in {DATASET_DIR}")

    print(f"Found {len(csv_files)} CSV files. Using embedding model: {EMBEDDING_MODEL} on device {DEVICE}")

    seen_fps = set()        # dedupe by chunk fingerprint
    ingest_map_rows = []    # for traceability: mapping of id -> source/file/row/chunk_index/snippet

    batch_docs = []
    batch_ids = []
    batch_metas = []

    total_chunks = 0
    for csv_path in csv_files:
        filename = os.path.basename(csv_path)
        print(f"\nProcessing file: {filename}")
        try:
            df = pd.read_csv(csv_path, low_memory=False)
        except Exception as e:
            print(f"Failed to read {filename}: {e}")
            continue

        df = df.fillna("")  # replace NaN with empty string for easier handling

        for idx, row in df.iterrows():
            row_dict = {col: row[col] for col in df.columns}
            doc_text = build_doc_from_row(row_dict)
            if not doc_text:
                continue

            # create chunks
            chunks = chunk_text(doc_text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP)
            if not chunks:
                continue

            for c_idx, chunk in enumerate(chunks):
                fp = text_fingerprint(chunk)
                if fp in seen_fps:
                    continue
                seen_fps.add(fp)

                # ID scheme: uuid4
                uid = str(uuid.uuid4())

                # metadata: include all original columns + provenance + chunk index
                meta = normalize_metadata(row_dict, filename, int(idx))
                meta["_chunk_index"] = str(c_idx)
                # include a short snippet to help debugging (first 120 chars)
                meta["_snippet"] = chunk[:120]

                batch_docs.append(chunk)
                batch_ids.append(uid)
                batch_metas.append(meta)

                ingest_map_rows.append({
                    "id": uid,
                    "source_file": filename,
                    "row_index": idx,
                    "chunk_index": c_idx,
                    "fingerprint": fp,
                    "snippet": chunk[:200].replace("\n", " ")
                })

                total_chunks += 1

                # flush batch
                if len(batch_docs) >= BATCH_SIZE:
                    flush_batch(collection, batch_docs, batch_ids, batch_metas, embedding_fn)
                    batch_docs, batch_ids, batch_metas = [], [], []

        # end rows of file
    # end files loop

    # final flush
    if batch_docs:
        flush_batch(collection, batch_docs, batch_ids, batch_metas, embedding_fn)

    # write ingest map
    ingest_map_path = os.path.join(CHROMA_DIR, "ingest_map.csv")
    with open(ingest_map_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "source_file", "row_index", "chunk_index", "fingerprint", "snippet"])
        writer.writeheader()
        for r in ingest_map_rows:
            writer.writerow(r)

    print(f"\nIngestion complete. Total unique chunks added: {total_chunks}")
    print(f"Ingest map saved to: {ingest_map_path}")

def flush_batch(collection, docs, ids, metas, embedding_fn):
    """
    Embeds and adds a batch to chroma collection.
    """
    if not docs:
        return
    print(f"  Embedding & adding batch of {len(docs)} docs...")
    embeddings = embedding_fn(docs)  # returns list of embeddings
    collection.add(documents=docs, embeddings=embeddings, metadatas=metas, ids=ids)
    print("  Batch added.")

if __name__ == "__main__":
    load_and_ingest()
