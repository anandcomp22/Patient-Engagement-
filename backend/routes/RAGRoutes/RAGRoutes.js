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
    const r = await axios.post(`${PYTHON_RAG_URL}/session/summarize`, req.body);
    res.json(r.data);
});

router.post("/session/answer", async (req, res) => {
    const r = await axios.post(`${PYTHON_RAG_URL}/session/answer`, req.body);
    res.json(r.data);
});

module.exports = router;