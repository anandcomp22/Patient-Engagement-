const express = require("express");
const bcrypt = require("bcryptjs");
const { Patient } = require("../db/models");
const { generateToken } = require("../utils/auth");
const authMiddleware = require("../middleware/authMiddleware");
const { Appointment } = require("../db/models");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
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


router.get("/appointments", authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.patientId });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
});


router.post("/signup", async (req, res) => {
  try {
    const { email, password, ...rest } = req.body;
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);  
    const patientCount = await Patient.countDocuments();

    const newPatient = new Patient({
      ...rest,
      email,
      password: hashedPassword, 
      patientId: 1000 + patientCount,
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
