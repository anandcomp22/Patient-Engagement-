from chromadb.config import Settings
import chromadb

client = chromadb.PersistentClient(path="chroma_db")

# inspect the summaries collection
col = client.get_collection("patient_summaries")

data = col.get()   # fetch all data

print("Documents:", data["documents"])
print("IDs:", data["ids"])
print("Metadata:", data["metadatas"])
