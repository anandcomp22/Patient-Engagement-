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
    try {
        const { patient, patientId, diagnosis, medicines, guidelines, nextVisit, doctorId, appointmentId, secureId } = req.body;

        const newPrescription = new Prescription({
            patientName: patient,
            patientId: patientId || 202,
            doctorId: doctorId || 101,
            appointmentId: appointmentId,
            diagnosis: diagnosis || "General Consultation",
            medicines: medicines || [],
            guidelines: guidelines || [],
            nextVisit: nextVisit || "TBD",
            secureId: secureId
        });

        await newPrescription.save();
        res.json({ message: "Prescription saved to historical records", prescriptionId: newPrescription._id });
    } catch (err) {
        console.error("Save error:", err);
        res.status(500).json({ error: "Failed to save prescription" });
    }
});

router.post("/save-and-send", async (req, res) => {
    try {
        const { email, patient, patientId, diagnosis, medicines, guidelines, nextVisit, doctorId, appointmentId, secureId, file } = req.body;

        // 1. Save to Database
        const newPrescription = new Prescription({
            patientName: patient,
            patientId: patientId || 202,
            doctorId: doctorId || 101,
            appointmentId: appointmentId,
            diagnosis: diagnosis || "General Consultation",
            medicines: medicines || [],
            guidelines: guidelines || [],
            nextVisit: nextVisit || "TBD",
            secureId: secureId
        });
        await newPrescription.save();

        // 2. Prepare Email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const medsList = (medicines || []).map(m => `<li><strong>${m.name}</strong>: ${m.dosage} (${m.frequency}) for ${m.duration}</li>`).join("");
        const guidelinesList = (guidelines || []).map(g => `<li>${g}</li>`).join("");

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: `AidME Prescription: ${patient} - ${new Date().toLocaleDateString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #1E5DA9;">AidME Healthcare</h2>
                    <p>Dear ${patient},</p>
                    <p>Your digital prescription from your recent consultation is ready.</p>
                    <hr />
                    <h3>Diagnosis: ${diagnosis || "Consultation Summary"}</h3>
                    <h4>Prescribed Medications:</h4>
                    <ul>${medsList || "<li>Please check attached PDF for details.</li>"}</ul>
                    <h4>Guidelines:</h4>
                    <ul>${guidelinesList || "<li>Follow standard recovery protocols.</li>"}</ul>
                    <p><strong>Next Visit:</strong> ${nextVisit || "TBD"}</p>
                    <hr />
                    <p style="font-size: 0.8rem; color: #718096;">This is a secure, system-generated document. Please keep it for your records.</p>
                </div>
            `,
        };

        // Attach PDF if filename is provided
        if (file) {
            const filePath = path.join(prescriptionsDir, file);
            if (fs.existsSync(filePath)) {
                mailOptions.attachments = [{ filename: file, path: filePath }];
            }
        }

        // 3. Send Email
        await transporter.sendMail(mailOptions);
        
        res.json({ 
            success: true, 
            message: "Prescription saved and emailed successfully!",
            recordId: newPrescription._id 
        });

    } catch (err) {
        console.error("Save & Send error:", err);
        res.status(500).json({ error: "Failed to process prescription delivery" });
    }
});

router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await Prescription.find({ patientId: Number(patientId) }).sort({ createdAt: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Failed to fetch historical prescriptions" });
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

router.post("/send", (req, res) => {
    const { email, file } = req.body;
    const filePath = path.join(prescriptionsDir, file);

    if (!fs.existsSync(filePath)) {
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
            res.status(500).json({ error: "Failed to send email" });
        } else {
            res.json({ message: "Email sent successfully!", info });
        }
    });
});

module.exports = router;
