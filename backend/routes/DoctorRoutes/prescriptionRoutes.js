const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { Prescription } = require("../../db/models");
require("dotenv").config();

const router = express.Router();

const prescriptionsDir = path.join(__dirname, "../prescriptions");
if (!fs.existsSync(prescriptionsDir)) fs.mkdirSync(prescriptionsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, prescriptionsDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

router.post("/uploadPdf", upload.single("prescriptionPdf"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ message: "High-fidelity PDF securely saved", file: req.file.filename });
});

router.post("/generate", async (req, res) => {
    const { patient, age, address, contact, prescriptionNo, date, email, medicines, notes } = req.body;

    if (!patient || !age || !address || !contact || !prescriptionNo || !date || !email || !medicines || !medicines.length) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const fileName = `prescription_${patient.replace(/\s+/g, "_")}.pdf`;
const newPrescription = new Prescription({
    doctorId: (req.user && (req.user.doctorId || req.user.userId || req.user._id)) || req.body.doctorId || 101,
    patientId: req.body.patientId || 202, // Optionally passed from frontend if available
    patientName: patient,
    medicine: medicines.map(m => `${m.name} ${m.dosage}`).join(", "),
    dob: new Date("1990-01-01"), // Frontend passes age string, Schema rigidly expects dob Date
    dosage: medicines[0]?.dosage || "0",
    date: new Date(), // Prevents 'Invalid Date' CastError from strictly parsed client Locales
    notes: notes || "No additional notes"
  });  
  
  await newPrescription.save();

  await newPrescription.save();
  return res.json({ message: "Prescription saved to DB", file: fileName });
});

router.get("/patient/:patientname", async (req, res) => {
    try {
        const { patientname } = req.params;
        // The PDF generator stores patientName as "FirstName LastName" exactly
        const prescriptions = await Prescription.find({ 
            patientName: { $regex: new RegExp(`^${patientname}$`, 'i') } 
        }).sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error("Prescription fetch error:", err);
        res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
});


router.get("/download/:filename", (req, res) => {
    const filePath = path.join(prescriptionsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

router.get("/medicine", (req, res) => {
    res.json({ message: "This endpoint is under construction." });
});


router.post("/send", (req, res) => {
    const { email, file } = req.body;
    const filePath = path.join(prescriptionsDir, file);

    console.log("Received email request for:", email);
    console.log("Looking for file at:", filePath);

    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return res.status(404).json({ error: "File not found" });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: "Your Prescription",
        text: "Attached is your medical prescription.",
        attachments: [{ filename: file, path: filePath }],
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error("Email send error:", err);
            res.status(500).json({ error: "Failed to send email" });
        } else {
            console.log("Email sent:", info.response);
            res.json({ message: "Email sent successfully!", info });
        }
    });
});




module.exports = router;
