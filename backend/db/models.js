const mongoose = require('mongoose');
require("dotenv").config();
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  }, 

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true, 
    unique: true,
    lowercase: true
  },

  phone: {
    type: String,
    required: true
  },

  dob: {
    type: Date,
    required: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin"
  },

  permissions: {
    type: [String],
    default: []
    // example: ["DOCTOR_VERIFY", "VIEW_REPORTS"]
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },

  lastLogin: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* Hash password */
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* Compare password */
AdminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const AdminLogSchema = new mongoose.Schema({
  action: String,
  entity: String,
  ip: String,
  entityId: mongoose.Schema.Types.ObjectId,
  adminId: mongoose.Schema.Types.ObjectId,
  meta: Object,
}, { timestamps: true });

const prescriptionSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  doctorId: { type: Number, required: true },
  patientId: { type: Number, required: true },
  medicines: [
    {
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      note: String
    }
  ],
  guidelines: [String],
  diagnosis: { type: String, default: "General Consultation" },
  date: { type: Date, default: Date.now },
  nextVisit: { type: String, default: "TBD" },
  notes: { type: String, default: "No additional notes" },
  secureId: { type: String } // For verification mapping
}, { timestamps: true });


const doctorSchema = new mongoose.Schema({
    doctorId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    specialty: { type: String, required: true },
    qualifications: { type: [String], required: true },
    experience: { type: Number, required: true },
    hospital: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },   
    profileImage: { type: String },
    licenseDocument: { type: String, default: null }, 
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDate: {type: Date},
    verificationStatus: {
      type: String,
      enum: ["not_uploaded", "pending", "verified", "rejected"],
      default: "not_uploaded"
    },
      verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
    isActive: { type: Boolean, default: true }
  }, { timestamps: true });

const feepaySchema = new mongoose.Schema({
    patientId: { type: Number, required: true},
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true
  },

  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Patient",
    required: true
  },

  doctorId: { type: Number, required: true },
  doctorName: { type: String, required: true },
  slotId: mongoose.Schema.Types.ObjectId,
  patientId: { type: Number, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientAge: { type: Number, required: true },
  roomId: String,
  paymentId: String,
  appointmentDate: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  callStatus: {
    type: String,
    enum: ["NOT_STARTED", "ACTIVE", "ENDED"],
    default: "NOT_STARTED"
  },
  reason: { type: String, default: "General Checkup" },
  type: { type: String, enum: ["video", "in-person"] },
  appstatus: {
    type: String,
    enum: ["confirmed", "pending", "cancelled", "completed"],
    default: "confirmed"
  },

  paymentstatus: {
    type: String,
    enum: ["paid", "pending", "failed"],
    default: "pending"
  },

  meetingLink: String
}, { timestamps: true });

const slotSchema = new mongoose.Schema({
  doctorId: Number,
  date: String,
  time: String,
  status: {
    type: String,
    enum: ["AVAILABLE", "LOCKED", "BOOKED"],
    default: "AVAILABLE"
  },
  lockExpiry: Date
});

const patientSchema = new mongoose.Schema({
    patientId: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: Date, required: true },
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
  
  
  const medicalReportSchema = new mongoose.Schema({
    patientId: { type: Number, required: true },
    reportName: { type: String, required: true },
    reportType: { type: String },
    uploadDate: { type: Date, default: Date.now },
    generationPlace: { type: String },
    filePath: { type: String, required: true },
    description: { type: String },
  }, { timestamps: true });


  const NotificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true }, // 'admin', or doctorId, or patientId
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });

  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'patient'], required: true },
    userId: { type: Number, required: true },
  });
  

const videocallSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  doctorId: {
    type: Number,
    required: true,
    index: true
  },
  patientId: {
    type: Number,
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  appstatus: {
  type: String,
  enum: ["confirmed", "pending", "cancelled", "appointment done"],
  default: "confirmed",
  lowercase: true
  },
  callduration: Number,
  recordinglink: String
}, { timestamps: true });


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
const Slot = mongoose.model('Slot', slotSchema);
const AdminLog = mongoose.model('AdminLog', AdminLogSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const MedicalReport = mongoose.model('MedicalReport', medicalReportSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = { Prescription, Doctor, FeePay, Appointment, Patient, videocall, User, videocallSchem, Slot, AdminLog, Admin, MedicalReport, Notification, connectToDatabase };
