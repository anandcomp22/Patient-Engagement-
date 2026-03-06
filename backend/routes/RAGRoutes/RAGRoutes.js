const express = require("express");
const axios = require("axios");
const router = express.Router();

const PYTHON_RAG_URL = "http://127.0.0.1:5000";

router.get("/", (req, res) => {
  res.json({ ok: true, message: "RAG Node Router Running" });
});

router.post("/session/create", async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_RAG_URL}/session/create`, req.body, {
      timeout: 5000,
    });
    res.json(r.data);
  } catch (err) {
    console.error("Python API call error:", err.message);
    res.status(500).json({ error: "Python RAG API not reachable", details: err.message });
  }
});

router.post("/session/summarize", async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_RAG_URL}/session/summarize`, req.body, { timeout: 60000 });
    res.json(r.data);
  } catch (err) {
    console.error("[RAG /session/summarize error]:", err.message);
    res.status(500).json({ error: "Python RAG API not reachable", details: err.message });
  }
});

router.post("/session/answer", async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_RAG_URL}/session/answer`, req.body, { timeout: 90000 });
    res.json(r.data);
  } catch (err) {
    console.error("[RAG /session/answer error]:", err.message);
    res.status(500).json({ error: "Python RAG API not reachable", details: err.message });
  }
});

router.post("/session/detect-condition", async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_RAG_URL}/session/detect-condition`, req.body);
    res.json(r.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "RAG API error", details: err.message });
  }
});


// -------------------------------------------------
// RAG ANSWER — used by VideoCall AI panel
// Proxies to Python /rag/answer on port 5000
// -------------------------------------------------
router.post("/answer", async (req, res) => {
  try {
    const r = await axios.post(`${PYTHON_RAG_URL}/rag/answer`, req.body, {
      timeout: 60000, // LLM can be slow
    });
    res.json(r.data);
  } catch (err) {
    console.error("[RAG /answer error]:", err.message);
    res.status(500).json({ error: "Python RAG API not reachable", details: err.message });
  }
});

// -------------------------------------------------
// MID-CALL ON-DEMAND MEDICINE RETRIEVAL
// Fast path: keyword extract → ChromaDB (no LLM)
// -------------------------------------------------
router.post("/session/retrieve-meds-now", async (req, res) => {
  try {
    const r = await axios.post(
      `${PYTHON_RAG_URL}/session/retrieve-meds-now`,
      req.body,
      { timeout: 30000 }
    );
    res.json(r.data);
  } catch (err) {
    console.error("[RAG /retrieve-meds-now error]:", err.message);
    res.status(500).json({ error: "Python RAG API not reachable", details: err.message });
  }
});

module.exports = router;