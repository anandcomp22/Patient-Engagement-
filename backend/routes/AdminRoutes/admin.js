const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const superAdminAuth = require("../../middleware/superAdminAuth");
const Admin = require("../../db/models").Admin;
const { Doctor, Patient, Appointment, FeePay, videocall } = require("../../db/models");

router.get("/", adminAuth, async (req, res) => {
  const admins = await Admin.find().select("-password");
  res.json(admins);
});

router.patch("/:id/role", adminAuth, async (req, res) => {
  const { role } = req.body;
  await Admin.findByIdAndUpdate(req.params.id, { role });
  res.json({ message: "Role updated" });
});

router.delete("/:id", adminAuth, async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin removed" });
});

router.get("/dashboard/metrics", adminAuth, async (req, res) => {
  const doctors = await Doctor.countDocuments();
  const patients = await Patient.countDocuments();
  const appointments = await Appointment.countDocuments();
  const pendingDoctors = await Doctor.countDocuments({ verificationStatus: "pending" });
  const activeCalls = await videocall.countDocuments({ appstatus: "confirmed" });

  const revenueAgg = await FeePay.aggregate([
    { $match: { paymentstatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$fees" } } }
  ]);

  res.json({
    doctors,
    patients,
    appointments,
    pendingDoctors,
    activeCalls,
    revenue: revenueAgg[0]?.total || 0
  });
});

module.exports = router;