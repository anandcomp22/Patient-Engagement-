const express = require("express");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const router = express.Router();

router.get("/generate", (req, res) => {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, "../prescriptions/Prescription.pdf");
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(18).text("Patient Prescription", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("Patient Name: Sayyoni Parate");
    doc.text("Doctor: Dr. Prathap C. Reddy");
    doc.text("Medicine: Paracetamol 500mg");
    doc.text("Dosage: 1 tablet twice a day");
    doc.text("Duration: 5 days");
    doc.end();

    writeStream.on("finish", () => {
        res.send("Prescription PDF generated successfully!");
    });

    writeStream.on("error", (err) => {
        console.error("Error generating PDF:", err);
        res.status(500).send("Failed to generate PDF");
    });
});

router.get("/download", (req, res) => {
    const filePath = path.join(__dirname, "../prescriptions/Prescription.pdf");

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Prescription not found. Please generate it first.");
    }

    res.download(filePath);
});

module.exports = router;
