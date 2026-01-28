const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Doctor, Patient, Appointment, FeePay } = require("../../db/models");

router.get("/metrics", adminAuth, async (req, res) => {
  const revenue = await FeePay.aggregate([
    { $match: { paymentstatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$fees" } } }
  ]);

  res.json({
    doctors: await Doctor.countDocuments(),
    patients: await Patient.countDocuments(),
    appointments: await Appointment.countDocuments(),
    pendingDoctors: await Doctor.countDocuments({ verificationStatus: "pending" }),
    revenue: revenue[0]?.total || 0
  });
});

module.exports = router;
