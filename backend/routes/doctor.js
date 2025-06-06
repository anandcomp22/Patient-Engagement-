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
    const doctor = await Doctor.findOne({ doctorId: req.user.doctorId }).select("firstName lastName email specialty");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



router.get('/appointment', authMiddleware, async (req, res) => {
  const doctorId = req.doctor._id; // assuming JWT sets this in middleware
  const appointments = await Appointment.find({ doctorId }).sort({ date: -1 });
  res.json(appointments);

  try {
    const { Appointment } = require("../db/models");

    const appointments = await Appointment.find({ doctorId: req.user.doctorId });

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

router.get("/doctorprescript", authMiddleware, (req, res) => {
  const scriptPath = `"C:/Users/morea/Downloads/Patient-Engagement-/backend/Traning_Model/optimized_test.py"`;

  // Use global python (assuming it's in your PATH)
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
