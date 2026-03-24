const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { FeePay } = require("../../db/models");

// GET all payments with optional filters
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.paymentstatus = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) { const end = new Date(to); end.setDate(end.getDate() + 1); filter.createdAt.$lt = end; }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      FeePay.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      FeePay.countDocuments(filter)
    ]);

    res.json({ payments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments", error: err.message });
  }
});

// Summary stats
router.get("/summary", adminAuth, async (req, res) => {
  try {
    const revenueAgg = await FeePay.aggregate([
      { $match: { paymentstatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$fees" } } }
    ]);

    const [total, paid, failed, pending] = await Promise.all([
      FeePay.countDocuments(),
      FeePay.countDocuments({ paymentstatus: "paid" }),
      FeePay.countDocuments({ paymentstatus: "fail" }),
      FeePay.countDocuments({ paymentstatus: "pending" })
    ]);

    res.json({
      totalRevenue: revenueAgg[0]?.total || 0,
      totalPayments: total,
      paidPayments: paid,
      failedPayments: failed,
      pendingPayments: pending
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment summary" });
  }
});

module.exports = router;
