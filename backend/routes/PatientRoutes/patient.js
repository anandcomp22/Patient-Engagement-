const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const { Patient, MedicalReport } = require("../../db/models");
const { generateToken } = require("../../utils/auth");
const authMiddleware = require("../../middleware/authMiddleware");
const { Appointment } = require("../../db/models");
const { Doctor, Slot, FeePay } = require("../../db/models");
const { sendNotification } = require("../../utils/notificationHelper");
const { v4: uuid } = require('uuid');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/reports"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/upload-report", upload.single("report"), async (req, res) => {
  try {
    const { uploadDate, generationPlace, patientId, reportType, description, reportName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newReport = new MedicalReport({
      patientId: Number(patientId),
      reportName: reportName || req.file.originalname,
      reportType,
      uploadDate: uploadDate || new Date(),
      generationPlace,
      filePath: req.file.path,
      description
    });

    await newReport.save();
    res.json({ message: "Report uploaded and saved successfully", report: newReport });
  } catch (err) {
    console.error("Error uploading report:", err);
    res.status(500).json({ message: "Failed to upload report", error: err.message });
  }
});

router.get("/reports/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const reports = await MedicalReport.find({ patientId }).sort({ uploadDate: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});

router.get("/doctors", async (req, res) => {
  const doctors = await Doctor.find({ isActive: true });
  res.json(doctors);
});

router.get("/appointments/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const appointments = await Appointment.find({ patientId }).sort({ appointmentDate: 1 });
    
    // Also fetch associated video call room if needed
    const { videocall } = require("../../db/models"); // To get roomId
    
    // Convert to plain objects
    const appointmentsWithRooms = await Promise.all(appointments.map(async (appt) => {
      const room = await videocall.findOne({ appointmentId: appt._id });
      return {
        ...appt.toObject(),
        roomId: room ? room.roomId : null
      };
    }));

    res.json(appointmentsWithRooms);
  } catch (err) {
    console.error("Error fetching patient appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.get("/available-slots", async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    const ALL_SLOTS = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
      "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", 
      "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", 
      "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    const dId = Number(doctorId);
    const queryDate = new Date(date);
    
    // Check start and end of day locally
    const startOfDay = new Date(queryDate.setHours(0,0,0,0));
    const endOfDay = new Date(queryDate.setHours(23,59,59,999));

    const bookedAppointments = await Appointment.find({
      doctorId: dId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      appstatus: { $in: ["confirmed", "pending", "Appointment Done", "completed"] }
    });

    const bookedTimes = bookedAppointments.map(app => app.startTime);
    let availableSlots = ALL_SLOTS.filter(slot => !bookedTimes.includes(slot));

    // Time-based filtering: If queryDate is today, filter out past times
    const now = new Date();
    const queryDateString = new Date(date).toISOString().split('T')[0];
    const todayString = now.toISOString().split('T')[0];

    // Alternatively, converting to local time strings
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const localTodayString = localNow.toISOString().split('T')[0];

    if (queryDateString === localTodayString || queryDateString === todayString) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      availableSlots = availableSlots.filter(slot => {
        // Parse "10:00 AM" or "02:30 PM"
        const [timePart, modifier] = slot.split(" ");
        let [hours, minutes] = timePart.split(":");
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        if (hours > currentHours) return true;
        if (hours === currentHours && minutes > currentMinutes) return true;
        return false;
      });
    }

    return res.status(200).json({ availableSlots });

  } catch (err) {
    console.error("Error fetching available slots:", err);
    return res.status(500).json({ message: "Failed to fetch slots", error: err.message });
  }
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

  const io = req.app.get("io");
  if (io) {
    await sendNotification(io, doctorId.toString(), "doctor", "New Appointment Booking", `Patient ID ${patientId} has booked a new appointment with you.`);
    await sendNotification(io, patientId.toString(), "patient", "Appointment Confirmed", `Your appointment with Doctor ID ${doctorId} is successfully confirmed.`);
  }

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

// ── Fetch patient profile by patientId (used by doctor during video call) ──
router.get("/profile/:patientId", async (req, res) => {
  try {
    const pid = Number(req.params.patientId);
    const patient = await Patient.findOne({ patientId: pid }).select("firstName lastName email phone age dob gender patientId district state country");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const age = patient.age || (patient.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : "N/A");
    res.json({
      patientId: patient.patientId,
      name: `${patient.firstName} ${patient.lastName}`,
      email: patient.email,
      phone: patient.phone || "N/A",
      age,
      gender: patient.gender || "N/A",
      address: [patient.district, patient.state, patient.country].filter(Boolean).join(", ") || "N/A"
    });
  } catch (err) {
    console.error("Error fetching patient profile:", err);
    res.status(500).json({ message: "Failed to fetch patient profile" });
  }
});

// ── Patient payment history ──
router.get("/payments/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const payments = await FeePay.find({ patientId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Error fetching patient payments:", err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

module.exports = router;
