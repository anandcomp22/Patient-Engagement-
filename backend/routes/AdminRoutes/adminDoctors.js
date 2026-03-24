const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Doctor } = require("../../db/models");

// GET all doctors with optional search/filter
router.get("/", adminAuth, async (req, res) => {
  try {
    const { search, specialty, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }, { licenseNumber: rx }];
    }
    if (specialty) filter.specialty = specialty;
    if (status) filter.verificationStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [doctors, total] = await Promise.all([
      Doctor.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Doctor.countDocuments(filter)
    ]);

    res.json({ doctors, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors", error: err.message });
  }
});

// GET single doctor
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password").lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor" });
  }
});

// PATCH verify/reject/suspend/activate
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { action } = req.body;
    const actionMap = {
      approve: { isVerified: true, verificationStatus: "verified", isActive: true },
      reject: { isVerified: false, verificationStatus: "rejected" },
      suspend: { isActive: false },
      activate: { isActive: true }
    };

    if (!actionMap[action]) return res.status(400).json({ message: "Invalid action" });

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: { ...actionMap[action], verifiedAt: new Date(), verifiedBy: req.admin?.adminId } },
      { new: true }
    );

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: `Doctor ${action}d successfully`, doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PATCH – old action URL kept for backward compat
router.patch("/:id/:action", adminAuth, async (req, res) => {
  const { id, action } = req.params;
  const actionMap = {
    approve: { isVerified: true, verificationStatus: "verified" },
    reject: { isVerified: false, verificationStatus: "rejected" },
    suspend: { isActive: false },
    activate: { isActive: true }
  };

  if (!actionMap[action]) return res.status(400).json({ message: "Invalid action" });

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: { ...actionMap[action], verifiedAt: new Date(), verifiedBy: req.admin?.adminId } },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: `Doctor ${action}d successfully`, doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE doctor
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete doctor" });
  }
});

module.exports = router;