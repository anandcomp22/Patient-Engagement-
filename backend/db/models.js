const mongoose = require('mongoose');
require("dotenv").config({path: '../.env'});
const prescriptionSchema = new mongoose.Schema({
    patientId: {
        type: Number,
        required: true,
        unique: true
    },
    patientname: {
        type: String,
        required: true
    },

    medicine : {
        type: String,
        required: true
    },

    age: {
        type: Number,
        required: true
    },
    dosage: {
        type:Number,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    notes: {
        type : String,
        required : true,
        default : 100
    }
    });


const doctorSchema = new mongoose.Schema({
    doctorId: {
        type: Number,
        required: true,
        unique: true
    },

    doctorname: {
        type: String,
        required: true
    },

    department: {
        type: String,
    },

    hospital: {
        type: String,
    }
});


const feepaySchema = new mongoose.Schema({
    patientId: {
        type: Number,
        required: true,
        unique: true,
        
    },
    
    patientname: {
        type : String,
        required : true
    },

    doctorId:{
        type: Number,
        required: true
    },

    doctorname: {
        type : String,
        required: true
    },

    fees: {
        type: Number,
        required: true
    }
    });


const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: Number,
        required: true,
        unique: false
    },
    date: {
        type: Date,
        required: true,
    },
    patientId: {
        type: Number,
        required: true,
        unique: true
    },
    doctorId: {
        type: Number,
        required : true,
        unique: true
    }
    });




const connectToDatabase = async function (){
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("connected to database")
    }
    catch(error){
        console.log("connection failed",error)
        process.exit(1)
    }
}

const prescription = mongoose.model('prescription', prescriptionSchema);
const doctor = mongoose.model('Doctor', doctorSchema);    
const feepay = mongoose.model('Fees', feepaySchema);
const appointment = mongoose.model('Appointment', appointmentSchema);


module.exports = {prescription,doctor,feepay,appointment,connectToDatabase};