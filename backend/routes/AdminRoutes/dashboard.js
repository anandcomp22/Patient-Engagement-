const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Doctor, Patient, Appointment, FeePay, videocall } = require("../../db/models");

router.get("/metrics", adminAuth, async (req, res) => {
  try {
    const [doctors, patients, appointments, pendingDoctors, activeCalls, revenueAgg] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Doctor.countDocuments({ verificationStatus: "pending" }),
      videocall.countDocuments({ appstatus: "confirmed" }),
      FeePay.aggregate([
        { $match: { paymentstatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$fees" } } }
      ])
    ]);

    res.json({
      doctors,
      patients,
      appointments,
      pendingDoctors,
      activeCalls,
      revenue: revenueAgg[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load metrics", error: err.message });
  }
});

// Recent appointments for dashboard
router.get("/recent-appointments", adminAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

module.exports = router;
