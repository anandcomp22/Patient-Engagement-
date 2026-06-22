const { Appointment, Patient } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");
    
    const pid = 46327;
    const appts = await Appointment.find({ patientId: pid });
    console.log(`Found ${appts.length} appointments for patient ${pid} (Number query)`);
    
    const apptsStr = await Appointment.find({ patientId: String(pid) });
    console.log(`Found ${apptsStr.length} appointments for patient ${pid} (String query)`);

    const pProfile = await Patient.findOne({ patientId: pid });
    console.log(`Patient profile (Number query): ${pProfile ? "Found" : "Not Found"}`);
    
    const pProfileStr = await Patient.findOne({ patientId: String(pid) });
    console.log(`Patient profile (String query): ${pProfileStr ? "Found" : "Not Found"}`);

    if (pProfile) {
        console.log(`- Name: ${pProfile.firstName} ${pProfile.lastName}`);
        console.log(`- patientId: ${pProfile.patientId}, type: ${typeof pProfile.patientId}`);
    }

    await mongoose.disconnect();
}

check();
