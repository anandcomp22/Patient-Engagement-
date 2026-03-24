const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Patient, Appointment } = require("../../db/models");

// GET all patients with search/filter/pagination
router.get("/", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [patients, total] = await Promise.all([
      Patient.find(filter).select("-password").sort({ _id: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Patient.countDocuments(filter)
    ]);

    res.json({ patients, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch patients", error: err.message });
  }
});

// GET single patient with appointment history
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select("-password").lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const appointments = await Appointment.find({ patientId: patient.patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ patient, appointments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch patient" });
  }
});

// DELETE patient
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete patient" });
  }
});

module.exports = router;
