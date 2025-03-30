const express = require("express");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
require("dotenv").config();

const VideocallDir = path.join(__dirname, "../VideoCall");
if (!fs.existsSync(VideocallDir)) fs.mkdirSync(VideocallDir);

const router = express.Router();
router.post("/generate", (req, res) => {
    const { patient, age, address, contact, prescriptionNo, date, email, medicines } = req.body;

    if (!patient || !age || !address || !contact || !prescriptionNo || !date || !email || !medicines || !medicines.length) {
        return res.status(400).json({ error: "All fields are required!" });
    }

    const fileName = `prescription_${patient.replace(/\s+/g, "_")}.pdf`;
    const filePath = path.join(VideocallDir, fileName);

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.rect(5, 40, 600, 150).fill("#1E5DA9");

    doc.fillColor("white")
        .fontSize(24)
        .font("Helvetica-Bold").text("AIDME PRESCRIPT", 70, 80);

    doc.moveDown(1);
    doc.fontSize(10)
        .font("Helvetica")
        .text("[Pimpri Chinchwad College Of Engineering & Research, Ravet]", 70, 110)
        .text("[Pcet.eduHub_comp22@pccoer.in / PCET_EducationHUB.com]", 70, 130);

    doc.image("C:\\Users\\morea\\OneDrive\\Desktop\\Patient-Engagement--1\\backend\\Icons\\Prescription_icon.png", 415, 40, { width: 130, height: 150 });


    doc.fontSize(15)
        .fillColor("#1E5DA9").text("Dr. Prathap C. Reddy", 65, 270);

    doc.fillColor("black")
        .fontSize(12)
        .text("[Medical Physician]", 65, 295)
        .text("+1 392-747-4830", 65, 320);

    doc.font("Helvetica-Bold")
        .fontSize(12)
        .text(`Prescription no.: ${prescriptionNo}`, 370, 270)
        .font("Helvetica-Bold")
        .text(`Date: ${date}`, 370, 295);

    doc.fillColor("black")
        .moveTo(60, 250).lineTo(540, 250).stroke()
        .moveTo(60, doc.y +30).lineTo(540, doc.y +30).stroke();

    doc.moveDown(5);
    doc.font("Helvetica-Bold").text("Medicines:", 60, doc.y);


    doc.font("Helvetica");
    medicines.forEach((med) => {
    doc.text(`[${med.name}, ${med.dosage},${med.duration}]`, { indent: 70 });
});

doc.moveDown(14);
const patientDetails = [
    { label: "Mr./Ms./Mrs.:", value: patient },
    { label: "Age:", value: age },
    { label: "Address:", value: address },
    { label: "Contact Num.:", value: contact },
];

patientDetails.forEach((detail) => {
    doc.text(detail.label, 50, doc.y+5);
    doc.text(detail.value, 150, doc.y -12);
    doc.moveTo(150, doc.y-2).lineTo(300, doc.y-2).stroke();
});

doc.image("C:\\Users\\morea\\OneDrive\\Desktop\\Patient-Engagement--1\\backend\\Icons\\Prescription_stamp.png", 420, 630, { width: 70, height: 70 });
doc.font("Helvetica-Bold").text("Doctor's Signature:", 400, doc.y+5);
doc.moveTo(400, doc.y + 5).lineTo(520, doc.y + 5).stroke();

doc.end();

    writeStream.on("finish", () => {
        res.json({ message: "Prescription saved", file: fileName });
    });

    writeStream.on("error", (err) => {
        res.status(500).json({ error: "Failed to save prescription" });
    });
});

module.exports = router;