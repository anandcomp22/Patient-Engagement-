const express = require("express");
const router = express.Router();
const {Appointment} = require("../db/models"); // Adjust path
const {Prescription} = require("../db/models"); // If exists

// 1. Daily appointment counts for chart
router.get("/appointments/daily", async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      {
        $group: {
          _id: { $substr: ["$date", 0, 10] },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// 2. Top prescribed medicines (based on VideoCallSummary)
const {videocallSchem} = require("../db/models");
router.get("/medicines/top", async (req, res) => {
  try {
    const summaries = await videocallSchem.find();
    const medMap = {};

    summaries.forEach(summary => {
      summary.medications.forEach(med => {
        if (!medMap[med.name]) medMap[med.name] = 0;
        medMap[med.name]++;
      });
    });

    const topMeds = Object.entries(medMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(topMeds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top medicines" });
  }
});

module.exports = router;
