const express = require('express');
const router = express.Router();
const { exec } = require("child_process");
const bcrypt = require("bcryptjs");
const { Doctor } = require("../db/models");
const { generateToken } = require("../utils/auth");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Protected data for authenticated users only", user: req.user });
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, ...rest } = req.body;
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctorCount = await Doctor.countDocuments();

    const newDoctor = new Doctor({
      ...rest,
      email,
      password: hashedPassword,
      doctorId: 1000 + doctorCount, 
    });

    await newDoctor.save();
    res.status(201).json({ message: "Doctor registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Doctor.findOne({ email });
    if (!user) return res.status(404).json({ message: "Doctor not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = generateToken(user, "doctor");

    res.status(200).json({ message: "Login successful", token, doctor: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('firstName lastName email'); // Select only the fields you need
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/appointment', authMiddleware, async (req, res) => {
  console.log("Getting Appointment data");

  try {
    const appointments = await Appointments.find();
    if (!appointments) {
      res.status(200).json({ message: "Appointments Not found" });
    }

    return res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error in fetching Appointments"
    });
  }
});

router.get("/doctorprescript", authMiddleware, async (req, res) => {
  console.log("Getting Prescription Data");

  try {
    exec(`python C:/Users/morea/Downloads/Patient-Engagement-/backend/optimized_test.py`, (error, stdout, stderr) => {
      if (error) {
        console.error("Exec Error:", error.message);
        return res.status(500).json({ error: error.message });
      }

      if (stderr && !stderr.includes("tensorflow/core/util/port.cc")) {
        console.error("Stderr:", stderr);
        return res.status(500).json({ error: stderr });
      }

      try {
        const output = stdout;
        res.json({ message: "Request successful", data: output });
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError.message);
        res.status(500).json({ error: "Invalid JSON response from Python script" });
      }
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error in fetching Prescriptions"
    });
  }
});

module.exports = router;
