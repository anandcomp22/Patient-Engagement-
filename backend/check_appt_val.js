const { Appointment } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");
    
    const appt = await Appointment.findOne({ patientName: "Sujal Shahare" });
    if (appt) {
        console.log(`Appointment for Sujal Shahare:`);
        console.log(`- appointmentDate (raw): ${appt.appointmentDate}`);
        console.log(`- appointmentDate (ISO): ${appt.appointmentDate.toISOString()}`);
        console.log(`- startTime: ${appt.startTime}`);
    } else {
        console.log("No appointment found for Sujal Shahare");
    }

    await mongoose.disconnect();
}

check();
