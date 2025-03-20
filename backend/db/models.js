const mongoose = require('mongoose');
require("dotenv").config();

const prescriptionSchema = new mongoose.Schema({
    patientId: { type: Number, required: true, unique: true },
    patientname: { type: String, required: true },
    medicine: { type: String, required: true },
    age: { type: Number, required: true },
    dosage: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, required: true, default: "No additional notes" }
});

const doctorSchema = new mongoose.Schema({
    doctorId: { type: Number, required: true, unique: true },
    doctorname: { type: String, required: true },
    department: { type: String },
    hospital: { type: String }
});

const feepaySchema = new mongoose.Schema({
    patientId: { type: Number, required: true },
    patientname: { type: String, required: true },
    doctorId: { type: Number, required: true },
    doctorname: { type: String, required: true },
    fees: { type: Number, required: true }
});

const appointmentSchema = new mongoose.Schema({
    appointmentId: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    patientId: { type: Number, required: true },
    doctorId: { type: Number, required: true }
});

const connectToDatabase = async function () {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is not defined in .env file");
        }

        await mongoose.connect(process.env.MONGODB_URL);

        console.log(" Connected to MongoDB");
    } catch (error) {
        console.error(" Connection to MongoDB failed:", error.message);
        process.exit(1);
    }
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const FeePay = mongoose.model('FeePay', feepaySchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = { Prescription, Doctor, FeePay, Appointment, connectToDatabase };
