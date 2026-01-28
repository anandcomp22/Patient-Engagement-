from flask import Flask, request, jsonify
from rag_engine import (
    answer_question,                  # final_answer
    store_summary_and_run_rag,        # create_summary_and_store
    extract_keywords,                 # extract_keywords_from_summary
    sessions,                         # sessions (Mongo)
    retrieve_medicine_docs            # retrieve_medicine_docs (imported)
)


app = Flask(__name__)

# -------------------------------------------------
# HOME
# -------------------------------------------------
@app.get("/")
def home():
    return jsonify({"ok": True, "message": "RAG Python API Running on Server"}), 200

@app.post("/ingest/medicines")
def ingest_medicines():
    try:
        from medicines_loader import load_and_ingest
        load_and_ingest()
        return {"ok": True, "message": "Medicines ingested successfully."}
    except Exception as e:
        return {"error": str(e)}


# -------------------------------------------------
# CREATE SESSION
# -------------------------------------------------
@app.post("/session/create")
def create_session():
    data = request.json
    session_id = data.get("session_id")
    patient_id = data.get("patient_id")

    if not session_id or not patient_id:
        return jsonify({"error": "session_id and patient_id required"}), 400

    if sessions.find_one({"_id": session_id}):
        return jsonify({"error": "Session already exists"}), 400

    sessions.insert_one({
        "_id": session_id,
        "patient_id": patient_id,
        "doctor_id": data.get("doctor_id"),
        "summary": "",
        "transcript_raw": [],
        "qa": [],
        "reports": []
    })

    return jsonify({"ok": True, "session_id": session_id})


# -------------------------------------------------
# SUMMARIZE TRANSCRIPT (LLM + DB UPDATE)
# -------------------------------------------------
@app.post("/session/summarize")
def summarize():
    data = request.json
    try:
        summ = store_summary_and_run_rag(
            data["session_id"],
            data["raw_text"]
        )
        return jsonify({"ok": True, "summary": summ})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# RAG ANSWER (Question → Final Answer)
# -------------------------------------------------
@app.post("/session/answer")
def rag_answer():
    data = request.json
    try:
        ans = answer_question(
            data["session_id"],
            data["question"]
        )
        return jsonify({"ok": True, "answer": ans})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# TEST MEDICINE RETRIEVAL
# -------------------------------------------------
@app.post("/session/test-meds")
def test_meds():
    data = request.json
    docs, meta = retrieve_medicine_docs(
        data.get("keywords", [])
    )
    return jsonify({"docs": docs, "meta": meta})



# -------------------------------------------------
# CONDITION DETECTION PIPELINE
# (Summary → Keyword Extraction)
# -------------------------------------------------
@app.post("/session/detect-condition")
def detect_condition():
    data = request.json
    session_id = data.get("session_id")
    raw_text = data.get("raw_text", "")

    if not session_id or not raw_text:
        return jsonify({"error": "session_id and raw_text required"}), 400

    try:
        # 1. summarize and update DB
        summary, structured  = store_summary_and_run_rag(session_id, raw_text)

        # 2. extract keywords/topics/conditions
        keywords = extract_keywords(summary)

        return jsonify({
            "ok": True,
            "summary": summary,
            "structured": structured,
            "conditions": keywords
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------
# SERVER RUN
# -------------------------------------------------
if __name__ == "__main__":
    print("RAG Python API running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
