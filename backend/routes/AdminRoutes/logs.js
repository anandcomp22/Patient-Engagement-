const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const AdminLog = require("../../db/models").AdminLog;

router.get("/", adminAuth, async (req, res) => {
  try {
    const { action, adminId, date, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action) filter.action = new RegExp(action, "i");
    if (adminId) filter.adminId = adminId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .populate("adminId", "email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AdminLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs", error: err.message });
  }
});

module.exports = router;
