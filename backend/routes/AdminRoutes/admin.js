const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const superAdminAuth = require("../../middleware/superAdminAuth");
const Admin = require("../../db/models").Admin;
const { Doctor, Patient, Appointment, FeePay, videocall } = require("../../db/models");

router.get("/count", adminAuth, async (req, res) => {
  const count = await Doctor.countDocuments({ verificationStatus: "pending" });
  res.json({ count });
});

router.get("/", adminAuth, async (req, res) => {
  const { status } = req.query;

  const filter = status ? { verificationStatus: status } : {};

  const doctors = await Doctor.find(filter).select(
    "firstName lastName email specialty licenseNumber licenseDocument verificationStatus"
  ).sort({ created: -1 });
  res.json(doctors);
});

router.patch("/:id/verify", adminAuth, async (req, res) => {
  const { status } = req.body; 

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  doctor.verificationStatus = status;
  doctor.isVerified = status === "verified";
  doctor.verifiedAt =  new Date();
  doctor.verifiedBy = req.admin.adminId;

  await doctor.save();
  res.json({ message: `Doctor ${status}` });
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
  const pendingDoctors = await Doctor.countDocuments({ verificationStatus: "pending" },
  );
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

router.patch("/:id/approve", adminAuth, async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedBy: req.admin.adminId,
    },
    { new: true }
  );

  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  res.json({ success: true, doctor });
});

router.patch("/:id/reject", adminAuth, async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: "rejected",
      verifiedAt: new Date(),
      verifiedBy: req.admin.adminId,
    },
    { new: true }
  );

  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  res.json({ success: true, doctor });
});

module.exports = router;