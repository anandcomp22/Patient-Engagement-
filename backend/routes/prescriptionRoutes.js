const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

const prescriptionsDir = path.join(__dirname, "../prescriptions");
if (!fs.existsSync(prescriptionsDir)) fs.mkdirSync(prescriptionsDir);

router.post("/generate", (req, res) => {
    const { patient, date, email, medicines } = req.body;

    if (!patient || !date || !email || !medicines || !medicines.length) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const fileName = `prescription_${patient.replace(/\s+/g, "_")}.pdf`;
    const filePath = path.join(prescriptionsDir, fileName);


    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Medical Prescription", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Patient: ${patient}`);
    doc.text(`Date: ${date}`);
    doc.moveDown();
    doc.text("Medicines:");
    medicines.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.name} - ${med.dosage}`, { indent: 20 });
    });
    doc.moveDown();
    doc.text("Doctor: Dr. Prathap C. Reddy");

    doc.end();

    writeStream.on("finish", () => {
        res.json({ message: "Prescription saved", file: fileName });
    });

    writeStream.on("error", (err) => {
        res.status(500).json({ error: "Failed to save prescription" });
    });
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
