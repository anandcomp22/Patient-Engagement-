const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { FeePay, Doctor, Patient } = require("../../db/models");

router.get("/", adminAuth, async (req, res) => {
  const payments = await FeePay.find()
    .populate("doctorId", "name email")
    .populate("patientId", "name email")
    .sort({ createdAt: -1 });

  res.json(payments);
});

router.get("/summary", adminAuth, async (req, res) => {
  const revenueAgg = await FeePay.aggregate([
    { $match: { paymentstatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$fees" } } }
  ]);

  res.json({
    totalRevenue: revenueAgg[0]?.total || 0,
    totalPayments: await FeePay.countDocuments(),
    paidPayments: await FeePay.countDocuments({ paymentstatus: "paid" }),
    failedPayments: await FeePay.countDocuments({ paymentstatus: "failed" })
  });
});

module.exports = router;
