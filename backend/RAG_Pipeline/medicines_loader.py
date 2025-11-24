import csv
import os
import uuid
from dotenv import load_dotenv
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

load_dotenv()

CHROMA_DIR = os.getenv("CHROMA_DB_DIR", "./chroma_db")
CSV_FILE = "medicines.csv"

# --------------------------
# 1. Chroma Client
# --------------------------
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)

# Create same embedding model used in API
embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/all-mpnet-base-v2", device="cuda"
)

# --------------------------
# 2. Delete old collection → recreate fresh one
# --------------------------
try:
    chroma_client.delete_collection("medicines")
    print("Old medicines collection deleted.")
except:
    print("No old medicines collection found.")

collection = chroma_client.create_collection(
    name="medicines",
    embedding_function=embedding_fn,
    metadata={"hnsw:space": "cosine"}
)

# --------------------------
# 3. Load Medicines CSV
# --------------------------
def load_from_csv(csv_path=CSV_FILE):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"{csv_path} not found")

    docs, ids, metas = [], [], []

    with open(csv_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            text = (
                f"{row.get('drugName', '')}\n"
                f"Introduction: {row.get('introduction', '')}\n"
                f"Dosage: {row.get('dosage_text', '')}\n"
                f"How To Use: {row.get('how_to_use', '')}\n"
                f"Sources: {row.get('sources', '')}"
            )
            docs.append(text)
            metas.append({"drugName": row.get("drugName", "")})
            ids.append(str(uuid.uuid4()))

    print("Embedding documents...")
    embeddings = embedding_fn(docs)

    print("Adding to Chroma...")
    collection.add(
        documents=docs,
        embeddings=embeddings,
        metadatas=metas,
        ids=ids
    )

    print(f"Loaded {len(docs)} medicines into ChromaDB.")


if __name__ == "__main__":
    load_from_csv()
    print("Medicine data loading complete.")
