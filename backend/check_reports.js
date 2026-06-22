const { MedicalReport } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");
    
    const pid = 46327;
    const reports = await MedicalReport.find({ patientId: pid });
    console.log(`Found ${reports.length} reports for patient ${pid}:`);
    reports.forEach(r => {
        console.log(`- ${r.reportName} (ID: ${r._id}, patientId: ${r.patientId})`);
    });
    
    // Also check all reports to see if any have a different patientId format (string vs number)
    const all = await MedicalReport.find({}).limit(5);
    console.log("Sample of all reports:");
    all.forEach(r => {
        console.log(`- ${r.reportName} (patientId: ${r.patientId}, type: ${typeof r.patientId})`);
    });

    await mongoose.disconnect();
}

check();
