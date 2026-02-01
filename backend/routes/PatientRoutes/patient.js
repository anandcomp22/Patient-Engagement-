const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { Patient } = require("../../db/models");
const { generateToken } = require("../../utils/auth");
const authMiddleware = require("../../middleware/authMiddleware");
const { Appointment } = require("../../db/models");
const { Doctor } = require("../../db/models");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/reports"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/upload-report", upload.single("report"), (req, res) => {
  const { uploadDate, generationPlace } = req.body;
  console.log("Upload Date:", uploadDate);
  console.log("Place:", generationPlace);
  console.log("File:", req.file);
  res.json({ message: "Report uploaded successfully" });
});

router.get("/doctors", async (req, res) => {
  const doctors = await Doctor.find({ isActive: true });
  res.json(doctors);
});

router.post("/lock", async (req, res) => {
  const { slotId } = req.body;

  const slot = await Slot.findOne({
    _id: slotId,
    status: "AVAILABLE"
  });

  if (!slot) return res.status(400).json({ message: "Slot not available" });

  slot.status = "LOCKED";
  slot.lockExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await slot.save();

  res.json({ message: "Slot locked", slot });
});

router.post("/confirm", async (req, res) => {
  const { slotId, doctorId, patientId, paymentId } = req.body;

  const slot = await Slot.findById(slotId);
  if (!slot || slot.status !== "LOCKED")
    return res.status(400).json({ message: "Invalid slot" });

  slot.status = "BOOKED";
  slot.lockExpiry = null;
  await slot.save();

  const appointment = await Appointment.create({
    doctorId,
    patientId,
    slotId,
    paymentId,
    status: "CONFIRMED",
    roomId: uuid(),
    callStatus: "NOT_STARTED"
  });

  res.json({ message: "Appointment confirmed", appointment });
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.user.patientId }).select("firstName lastName email age");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
      const newPatient = new Patient(req.body);
      const savedPatient = await newPatient.save();

      io.emit("newPatient", savedPatient);

      res.status(201).json(savedPatient);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


router.post("/signup", async (req, res) => {
  try {
    const { email, password, confirmPassword, ...rest } = req.body;
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);  
    const patientCount = await Patient.countDocuments();

    const newPatient = new Patient({
      ...rest,
      email,
      password: hashedPassword, 
      patientId: Math.floor(Math.random() * 100000) + patientCount,
    });

    await newPatient.save();
    res.status(201).json({ message: "Patient registered successfully" });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await Patient.findOne({ email });
  if (!user) return res.status(404).json({ message: "Patient not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = generateToken(user, "patient");

  res.status(200).json({ message: "Login successful", token, patient: user });
});

module.exports = router;
