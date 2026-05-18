const express = require('express');
const router = express.Router();
const { exec } = require("child_process");
const bcrypt = require("bcryptjs");
const { Doctor } = require("../../db/models");
const { generateToken } = require("../../utils/auth");
const authMiddleware = require("../../middleware/authMiddleware");
const { Appointment } = require("../../db/models");
const upload = require("../../middleware/upload");


router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Protected data for authenticated users only", user: req.user });
});

router.post(
  "/signup",
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        firstName,middleName, lastName, email, phone,dob, licenseNumber, specialty,
        qualifications, experience, hospital, country, state, district, password
      } = req.body;

      const existing = await Doctor.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newDoctor = new Doctor({
        doctorId: Math.floor(Math.random() * 100000),
        firstName,
        middleName,
        lastName,
        email,
        phone,
        dob,  
        licenseNumber,
        specialty,
        qualifications,
        experience,
        hospital,
        country,
        state,
        district,
        password: hashedPassword,
        image: req.files?.profileImage?.[0]?.filename,
        licenseDocument: `license/${req.files?.license?.[0]?.filename}`,
        verificationStatus: "pending"
      });

      await newDoctor.save();
      res.status(201).json({ message: "Doctor registered successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error registering doctor", error: err.message });
    }
  }
);

router.post("/signin", async (req, res) => {
  try {
  const { email, password } = req.body;

  const doctor = await Doctor.findOne({ email });
  if (!doctor) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, doctor.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  if (doctor.verificationStatus !== "verified") {
    return res.status(403).json({
      message: "Your license is under verification. Please wait for admin approval."
    });
  }

  const token = generateToken(doctor, "doctor");

  res.status(200).json({ message: 'Login successful', token, doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log("TOKEN doctorId:", req.user.doctorId);
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.user.doctorId }).select("firstName lastName email specialty verificationStatus");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/patients", authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;

    const appointments = await Appointment.find({ doctorId }).sort({ appointmentDate: -1 });

    // Extract unique patient IDs
    const patientIds = [...new Set(appointments.map(a => a.patientId))];
    
    // Fetch all related patient full profiles
    const { Patient } = require("../../db/models");
    const fullPatientProfiles = await Patient.find({ patientId: { $in: patientIds } });
    const profileMap = new Map(fullPatientProfiles.map(p => [p.patientId, p]));

    const calculateAge = (dob) => {
      if (!dob) return null;
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    };

    // Build the list using full profiles as source of truth
    const patientsList = appointments.map(a => {
      const profile = profileMap.get(a.patientId);
      
      return {
        patientId: a.patientId,
        firstName: profile?.firstName || a.patientName?.split(' ')[0] || "Patient",
        lastName: profile?.lastName || a.patientName?.split(' ').slice(1).join(' ') || "",
        email: profile?.email || a.patientEmail || "N/A",
        phone: profile?.phone || a.patientPhone || "N/A",
        patientAge: profile ? calculateAge(profile.dob) : a.patientAge,
        gender: profile?.gender || "N/A",
        lastVisit: a.updatedAt,
        nextAppointment: a.appointmentDate,
        conditions: a.conditions || []
      };
    });

    res.json(patientsList);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

router.get('/app', authMiddleware, async (req, res) => {
  console.log(" /appointment route hit");
  try {
    console.log("Decoded user in appointment route:", req.user);
    const doctorId = Number(req.user.doctorId);
    const appointments = await Appointment.find({ doctorId }).sort({ appointmentDate: -1 });
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

router.get("/today-count", authMiddleware, async (req, res) => {
  const doctorId = req.user.doctorId;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await Appointment.countDocuments({
    doctorId,
    appointmentDate: { $gte: start, $lte: end },
    appstatus: { $ne: "cancelled" }
  });

  res.json({ count });
});
 
module.exports = router;
