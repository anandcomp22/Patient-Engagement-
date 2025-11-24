const mongoose = require('mongoose');
require("dotenv").config();

const prescriptionSchema = new mongoose.Schema({
    doctorId: { type: Number, required: true, unique: true },
    patientId: { type: Number, required: true, unique: true },
    patientname: { type: String, required: true },
    medicine: { type: String, required: true },
    age: { type: Number, required: true },
    dosage: { type: String, required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: "No additional notes" }
});

const doctorSchema = new mongoose.Schema({
    doctorId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    specialty: { type: String, required: true },
    qualifications: { type: [String], required: true },
    experience: { type: Number, required: true },
    hospital: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true }
  }, { timestamps: true });

const feepaySchema = new mongoose.Schema({
    patientId: { type: Number, required: true, unique: true },
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
  appointmentId: { type: Number, unique: true },
  doctorId: { type: Number, required: true,  },
  doctorName: { type: String, required: true }, 
  patientId: { type: Number, required: true },
  patientName: { type: String, required: true }, 
  patientEmail: { type: String, required: true }, 
  date: { type: Date, required: true },
  time: { type: String, required: true }, 
  reason: { type: String, default: "General Checkup" },
  appstatus: { type: String, default: "confirmed" },
  paymentstatus: { type: String, default: "pending" }
}, { timestamps: true });


const patientSchema = new mongoose.Schema({
    patientId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    country: { type: String },
    state: { type: String },
    district: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    contact: { type: Number },
    bloodgroup: { type: String },
    allergies: { type: String },
    emergencycontact: {
      ename: { type: String },
      econtact: { type: Number },
      relation: { type: String }
    },
  });


  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'patient'], required: true },
    userId: { type: Number, required: true },
  });
  

const videocallSchema = new mongoose.Schema({
    appointmentId: { type: Number, required: true },
    doctorId: { type: Number, required: true },
    patientId: { type: Number, required: true },
    roomId:{ type: String, required: true, unique:true},
    appstatus: {type: String, 
        enum: ['confirmed', 'pending', 'cancelled']},
    
    callduration: { type: Number},
    recordinglink: { type: String}
})

const VideoCallSummarySchema = new mongoose.Schema({
    roomId: String,
    doctorName: String,
    doctorEmail: String,
    patientName: String,
    patientEmail: String,
    startTime: Date,
    endTime: Date,
    transcription: String, 
    detectedCondition: String,
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String
      }
    ]
  }, { timestamps: true });

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
const Patient = mongoose.model('Patient', patientSchema);
const videocall = mongoose.model('videocall', videocallSchema);
const User = mongoose.model('User', userSchema);
const videocallSchem = mongoose.model("VideoCallSummary", VideoCallSummarySchema);

module.exports = { Prescription, Doctor, FeePay, Appointment,Patient,videocall,User,videocallSchem, connectToDatabase };
