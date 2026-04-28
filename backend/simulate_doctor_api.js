const { Appointment, Patient } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");
    
    const doctorId = 47236; 
    const appointments = await Appointment.find({ doctorId });
    console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
    
    const patientIds = [...new Set(appointments.map(a => a.patientId))];
    console.log("Unique patientIds from appointments:", patientIds);
    
    const fullPatientProfiles = await Patient.find({ patientId: { $in: patientIds } });
    console.log(`Found ${fullPatientProfiles.length} patient profiles for these IDs`);
    
    fullPatientProfiles.forEach(p => {
        console.log(`- ${p.firstName} ${p.lastName} (patientId: ${p.patientId}, type: ${typeof p.patientId})`);
    });

    await mongoose.disconnect();
}

check();
