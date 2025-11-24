from backend.RAG_Pipeline.rag_engine import extract_keywords_from_summary

summary = "Patient has fever, cough, chest tightness and mild asthma issue."
print(extract_keywords_from_summary(summary))