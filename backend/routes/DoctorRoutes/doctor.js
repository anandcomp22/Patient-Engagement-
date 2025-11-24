const express = require('express');
const router = express.Router();
const { exec } = require("child_process");
const bcrypt = require("bcryptjs");
const { Doctor } = require("../../db/models");
const { generateToken } = require("../../utils/auth");
const authMiddleware = require("../../middleware/authMiddleware");
const { Appointment } = require("../../db/models");


router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Protected data for authenticated users only", user: req.user });
});

router.post("/signup", async (req, res) => {
  try {
    const {
    firstName, lastName, email, phone, licenseNumber, specialty,
    qualifications, experience, hospital, country, state, district, password
  } = req.body;

    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = new Doctor({
      doctorId: Math.floor(Math.random() * 100000),
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      specialty,
      qualifications,
      experience,
      hospital,
      country,
      state,
      district,
      password: hashedPassword
    });

    await newDoctor.save();
    res.status(201).json({ message: 'Doctor registered successfully', doctor: newDoctor });
  } catch (err) {
    res.status(500).json({ message: 'Error registering doctor', error });
  }
});

router.post("/signin", async (req, res) => {
  try {
  const { email, password } = req.body;

  const doctor = await Doctor.findOne({ email });
  if (!doctor) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken(doctor, "doctor");

  res.status(200).json({ message: 'Login successful', token, doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.user.doctorId }).select("firstName lastName email specialty");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/app', authMiddleware, async (req, res) => {
  console.log(" /appointment route hit");
  try {
    console.log("Decoded user in appointment route:", req.user);
    const doctorId = req.user.doctorId;
    const appointments = await Appointment.find({ doctorId }).sort({ date: -1 });
    return res.status(200).json(appointments);
    
  } catch (err) {
    console.error("Error fetching appointments:", err);
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
});


router.get("/doctorprescript", authMiddleware, (req, res) => {
  const scriptPath = `"C:/Users/morea/Downloads/Patient-Engagement-/backend/Traning_Model/optimized_test.py"`;

  exec(`python ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error("Execution error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (stderr) {
      console.error("Python stderr:", stderr);
    }

    try {
      const lines = stdout.trim().split("\n").map(line => JSON.parse(line));
      const prescriptions = lines.map(line => {
        const [id, name, condition, rating] = line.split(",");
        return { id, name, condition, rating };
      });

      res.json({ message: "Prescription generated", prescriptions });
    } catch (err) {
      console.error("JSON Parse error:", err.message);
      res.status(500).json({ error: "Failed to parse prescription output" });
    }
  });
});

module.exports = router;
