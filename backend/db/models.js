const mongoose = require('mongoose');
require("dotenv").config();

const prescriptionSchema = new mongoose.Schema({
    doctorId: { type: Number, required: true, unique: true },
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
    email: {type: String, required: true},
    password: {type: String, required: true},
    specialization: { type: String, required: true },
    hospital: { type: String },
    availableslots: {type: Number, required: true},

});

const feepaySchema = new mongoose.Schema({
    patientId: { type: Number, required: true },
    patientname: { type: String, required: true },
    doctorId: { type: Number, required: true },
    doctorname: { type: String, required: true },
    paymentstatus: {type: String, 
        enum: ['paid', 'pending', 'fail']},
    
    paymentmethod: {type: String, required: true},

    fees: { type: Number, required: true },
    transactionId :{ type: Number, required: true, unique: true }
});

const appointmentSchema = new mongoose.Schema({
    appointmentId: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    patientId: { type: Number, required: true },
    doctorId: { type: Number, required: true },
    appstatus: {type: String, 
            enum: ['confirmed', 'pending', 'cancelled']},
    paymentstatus: {type: String, 
            enum: ['paid', 'pending', 'fail']}

});

const patientSchema = new mongoose.Schema({
    patientId: { type: Number, required: true, unique: true },
    patientname: { type: String, required: true },
    email: { type: String, required: true },
    medicinehistory: { type: String, require: false},
    age: { type: Number, required: true },
    gender: {
        type: String,
        enum: ['male', 'female','other']
    },
    contact: { type: Number, required: true },
    bloodgroup: { type: String, required: true },
    allergies: { type: String },

    emergencycontact: {
        ename: { type: String, required: true },
        econtact:{ type: Number, required: true },
        relation: { type: String, required: true }
    }

});

const videocallSchema = new mongoose.Schema({
    appointmentId: { type: Number, required: true, unique: true },
    doctorId: { type: Number, required: true, unique: true },
    patientId: { type: Number, required: true, unique: true },
    roomId:{ type: String, required: true, unique:true},
    appstatus: {type: String, 
        enum: ['confirmed', 'pending', 'cancelled']},
    
    callduration: { type: Number},
    recordinglink: { type: String, unique: true}
})

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
