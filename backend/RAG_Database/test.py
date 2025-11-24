import os
from langchain_community.llms import Ollama
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.llms import HuggingFacePipeline
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from transformers import pipeline


# 1. Setup Keys and Models

os.environ["HUGGINGFACEHUB_API_TOKEN"] = "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"



# 2. Load the Medicines CSV

loader = CSVLoader(
    file_path="medicines.csv", 
    encoding="utf-8",
    csv_args={
        "delimiter": ",",
        "quotechar": '"',
        "fieldnames": ["drugName", "introduction", "dosage_text", "how_to_use", "sources"],
    },
)
data = loader.load()
print(f"✅ Loaded {len(data)} rows from {"medicines.csv"}")



# 3. Split Documents into Chunks

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
documents = []
for row in data:
    chunks = text_splitter.split_text(row.page_content)
    for chunk in chunks:
        documents.append(Document(page_content=chunk))

print(f"✅ Total text chunks created: {len(documents)}")




# 4. Create Embeddings and Vector Store

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(documents=documents, embedding=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
print("✅ Vectorstore initialized.")




# 5. Define Prompt Template

template = """
You are a helpful AI medical assistant.
Use the provided context to generate a concise, professional summary of the medicine.

Context:
{context}

Question: {question}

Format the answer as:
- **Medicine Name:** 
- **Use / Purpose:** 
- **Dosage:** 
- **How to Use:** 
- **Side Effects (if mentioned):**

If information is not in the context, say "Not available in context."
Keep the answer short and factual.
"""

prompt = ChatPromptTemplate.from_template(template)




# 6. Load llama3.2 Model (locally)

llm = Ollama(model="llama3.2") 
print("✅ Model loaded successfully!")




# 7. Build RAG Chain

def format_docs(docs):
    return "\n\n".join([doc.page_content for doc in docs])

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)





# 8. Interactive Query Loop

print("\n💊 AidME RAG Assistant Ready!")
print("Type a medicine-related question (or 'exit' to quit)\n")

while True:
    user_input = input("🧠 Ask: ")
    if user_input.lower() in ["exit", "quit"]:
        print("👋 Exiting AidME Assistant.")
        break

    response = rag_chain.invoke(user_input)
    print("\n🩺 Response:\n", response)
    print("-" * 60)
