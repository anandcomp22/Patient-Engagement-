const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.NEWS_INSIGHT_API_KEY;

router.get('/medical-news', async (req, res) => {
  try {
    const response = await axios.get(
      `http://api.mediastack.com/v1/news?access_key=${API_KEY}&categories=health&languages=en&limit=5`
    );
    res.json(response.data.data);
  } catch (err) {
    console.error("News fetch failed:", err?.response?.status || err.message);
    return res.status(500).json({ message: "Failed to fetch medical news" });
  }
});

module.exports = router;
