"""
rag_api.py  — Flask REST API for the RAG pipeline
===================================================
Runs on  http://0.0.0.0:5000
Node.js proxy (port 8000) forwards /rag/* → here.

Start: python rag_api.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from rag_service import (
    final_answer,
    create_summary_and_store,
    extract_keywords,
    sessions,
    retrieve_medicine_docs,
)

app = Flask(__name__)
CORS(app)


# ─────────────────────────────────────────────
# HOME / HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/")
def home():
    try:
        sessions.count_documents({})
        db_status = "connected"
    except Exception:
        db_status = "error"

    return jsonify({
        "ok":      True,
        "message": "RAG Python API Running on Server",
        "mongodb": db_status,
        "chroma":  "connected"
    }), 200


# ─────────────────────────────────────────────
# 1. CREATE SESSION
# ─────────────────────────────────────────────
@app.post("/session/create")
def create_session():
    data       = request.json or {}
    session_id = data.get("session_id")
    patient_id = data.get("patient_id")
    doctor_id  = data.get("doctor_id", "")

    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    if not patient_id:
        return jsonify({"error": "patient_id required"}), 400

    if sessions.find_one({"_id": session_id}):
        return jsonify({"error": "Session already exists"}), 400

    sessions.insert_one({
        "_id":            session_id,
        "patient_id":     patient_id,
        "doctor_id":      doctor_id,
        "summary":        "",
        "transcript_raw": [],
        "qa":             [],
        "reports":        [],
        "created_at":     datetime.utcnow()
    })

    return jsonify({"ok": True, "session_id": session_id})


# ─────────────────────────────────────────────
# 2. SUMMARIZE TRANSCRIPT  (LLM → ChromaDB + Mongo)
# ─────────────────────────────────────────────
@app.post("/session/summarize")
def summarize():
    data       = request.json or {}
    session_id = data.get("session_id")
    raw_text   = data.get("raw_text", "")

    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    if not raw_text.strip():
        return jsonify({"error": "raw_text is empty"}), 400

    try:
        summary = create_summary_and_store(session_id, raw_text)
        return jsonify({"ok": True, "summary": summary})
    except Exception as e:
        return jsonify({"error": f"Summarisation failed: {str(e)}"}), 500


# ─────────────────────────────────────────────
# 3. RAG ANSWER  (session question → Ollama answer)
# ─────────────────────────────────────────────
@app.post("/session/answer")
def rag_answer_session():
    data       = request.json or {}
    session_id = data.get("session_id")
    question   = data.get("question", "Recommend medicines based on the consultation.")

    if not session_id:
        return jsonify({"error": "session_id required"}), 400

    try:
        answer, keywords, med_docs, med_metas = final_answer(session_id, question)
        return jsonify({
            "ok":             True,
            "answer":         answer,
            "keywords":       keywords,
            "documents":      med_docs[:5],
            "metadata":       med_metas[:5]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# 4. RAG ANSWER  — used by VideoCall AI panel
#    AiPanel.js → Node /rag/answer → here
# ─────────────────────────────────────────────
@app.post("/rag/answer")
def rag_answer_videocall():
    data       = request.json or {}
    session_id = data.get("session_id")
    question   = data.get("question", "Recommend medicines based on the consultation.")

    if not session_id:
        return jsonify({"error": "session_id required"}), 400

    try:
        answer, keywords, med_docs, med_metas = final_answer(session_id, question)
        return jsonify({
            "ok":            True,
            "answer":        answer,
            "keywords":      keywords,
            "medicines_found": len(med_docs),
            "documents":     med_docs[:5],
            "metadata":      med_metas[:5]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# 5. MID-CALL ON-DEMAND RETRIEVAL
#    Fast path: transcript text → keywords → ChromaDB
#    No LLM summarisation; returns in ~1-2 seconds
# ─────────────────────────────────────────────
@app.post("/session/retrieve-meds-now")
def retrieve_meds_now():
    data           = request.json or {}
    raw_transcript = data.get("raw_transcript", "")
    session_id     = data.get("session_id", "")

    # Fallback: try stored summary if no transcript sent
    if not raw_transcript.strip() and session_id:
        session        = sessions.find_one({"_id": session_id})
        raw_transcript = (session or {}).get("summary", "") if session else ""

    if not raw_transcript.strip():
        return jsonify({"error": "raw_transcript is required"}), 400

    try:
        keywords = extract_keywords(raw_transcript)

        if not keywords:
            return jsonify({
                "ok":       True,
                "keywords": [],
                "documents": [],
                "metadata":  [],
                "message":   "No medical keywords found in current transcript yet."
            })

        med_docs, med_metas = retrieve_medicine_docs(keywords, top_k=5)

        return jsonify({
            "ok":       True,
            "keywords": keywords,
            "documents": med_docs,
            "metadata":  med_metas
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# 6. CONDITION DETECTION
#    Summarise + keyword extract in one call
# ─────────────────────────────────────────────
@app.post("/session/detect-condition")
def detect_condition():
    data       = request.json or {}
    session_id = data.get("session_id")
    raw_text   = data.get("raw_text", "")

    if not session_id or not raw_text.strip():
        return jsonify({"error": "session_id and raw_text required"}), 400

    try:
        summary  = create_summary_and_store(session_id, raw_text)
        keywords = extract_keywords(summary)
        return jsonify({
            "ok":        True,
            "summary":   summary,
            "conditions": keywords
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# 7. TEST MEDICINE RETRIEVAL  (debug helper)
# ─────────────────────────────────────────────
@app.post("/session/test-meds")
def test_meds():
    data     = request.json or {}
    keywords = data.get("keywords", [])
    if not keywords:
        return jsonify({"error": "keywords list required"}), 400
    docs, meta = retrieve_medicine_docs(keywords)
    return jsonify({"ok": True, "docs": docs, "meta": meta})


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("RAG Python API running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
