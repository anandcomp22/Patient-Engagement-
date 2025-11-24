from flask import Flask, request, jsonify
from rag_engine import (
    final_answer,
    create_summary_and_store,
    sessions,
    retrieve_medicine_docs
)

app = Flask(__name__)

@app.get("/")
def home():
    return jsonify({"ok": True, "message": "RAG Python API Running on Server"}), 200

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

@app.post("/session/summarize")
def summarize():
    data = request.json
    try:
        summ = create_summary_and_store(data["session_id"], data["raw_text"])
        return jsonify({"ok": True, "summary": summ})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/session/answer")
def rag_answer():
    data = request.json
    try:
        ans = final_answer(data["session_id"], data["question"])
        return jsonify({"ok": True, "answer": ans})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/session/test-meds")
def test_meds():
    data = request.json
    docs, meta = retrieve_medicine_docs(data.get("keywords", []))
    return jsonify({"docs": docs, "meta": meta})

if __name__ == "__main__":
    print("RAG Python API running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)