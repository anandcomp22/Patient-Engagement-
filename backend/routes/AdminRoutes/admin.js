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

/**
 * GET /admin/verify?status=pending
 */
router.get("/", adminAuth, async (req, res) => {
  const { status } = req.query;

  const filter = status ? { verificationStatus: status } : {};

  const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
  res.json(doctors);
});

/**
 * PATCH /admin/verify/:id/approve
 */
router.patch("/:id/approve", adminAuth, async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedBy: req.admin.id,
    },
    { new: true }
  );

  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  res.json({ success: true, doctor });
});

/**
 * PATCH /admin/verify/:id/reject
 */
router.patch("/:id/reject", adminAuth, async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: "rejected",
      verifiedAt: new Date(),
      verifiedBy: req.admin.id,
    },
    { new: true }
  );

  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  res.json({ success: true, doctor });
});

router.get("/count", adminAuth, async (req, res) => {
  const count = await Doctor.countDocuments({ verificationStatus: "pending" });
  res.json({ count });
});

module.exports = router;