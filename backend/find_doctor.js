const { Doctor } = require("./db/models");
const mongoose = require("mongoose");
require("dotenv").config();

async function find() {
    await mongoose.connect(process.env.MONGODB_URL);
    const d = await Doctor.findOne({});
    if (d) {
        console.log(`Doctor found: ${d.firstName} (doctorId: ${d.doctorId})`);
    }
    await mongoose.disconnect();
}

find();
