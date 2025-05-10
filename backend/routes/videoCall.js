const express = require("express");
const router = express.Router();
const { videocallSchem } = require("../db/models");

router.post("/summary", async (req, res) => {
  try {
    const summary = new videocallSchem(req.body);
    await summary.save();
    res.status(201).json({ success: true, message: "Summary saved." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save summary", error });
  }
});

module.exports = router;
