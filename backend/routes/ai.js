const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai"); // Updated import
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/detect-condition", async (req, res) => {
  const { transcript } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You're a medical assistant. From this transcript, extract the most likely medical condition discussed. Respond only with the condition name in lowercase." },
        { role: "user", content: transcript },
      ],
    });

    const condition = response.choices[0].message.content.trim().toLowerCase();
    res.json({ condition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to detect condition" });
  }
});

module.exports = router;
