const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// GET /api/ai/status - Check if Ollama is online
router.get("/status", async (req, res) => {
  try {
    await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 2000 });
    res.json({ online: true });
  } catch (err) {
    res.json({ online: false });
  }
});

// POST /api/ai/detect-condition - Detect medical condition from transcript
router.post("/detect-condition", async (req, res) => {
  const { transcript } = req.body;

  try {
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: "llama3.2",
      messages: [
        { role: "system", content: "You're a medical assistant. From this transcript, extract the most likely medical condition discussed. Respond only with the condition name in lowercase." },
        { role: "user", content: transcript },
      ],
      stream: false,
    });

    const condition = response.data.message.content.trim().toLowerCase();
    res.json({ condition });
  } catch (err) {
    console.error("Error in /detect-condition:", err.message);
    res.status(500).json({ error: "Failed to detect condition" });
  }
});

// POST /api/ai/chat - Proxy streaming chat calls to Ollama
router.post("/chat", async (req, res) => {
  try {
    const response = await axios({
      method: "post",
      url: `${OLLAMA_BASE}/api/chat`,
      data: req.body,
      responseType: "stream",
    });
    
    res.setHeader("Content-Type", "application/x-ndjson");
    response.data.pipe(res);
  } catch (err) {
    console.error("Error in chatbot stream proxy /chat:", err.message);
    res.status(500).json({ error: "Failed to communicate with local Ollama chatbot" });
  }
});

module.exports = router;
