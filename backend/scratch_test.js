const { Patient } = require("./db/models");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./utils/auth");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to DB");

  const patient = await Patient.findOne({ patientId: 46327 });
  if (!patient) {
    console.log("Patient not found");
    return;
  }
  console.log("Patient found:", patient.firstName, patient.lastName, "ID:", patient.patientId);

  const token = generateToken(patient, "patient");
  console.log("Generated Token:", token);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Decoded Payload:", decoded);

  if (decoded.role === "patient" || decoded.patientId) {
    const patientIdFromToken = decoded.patientId;
    const queryPatientId = Number(patientIdFromToken);
    const dbPatient = await Patient.findOne({ patientId: queryPatientId }).select("-password");
    console.log("Decoded patient found in DB:", dbPatient ? `${dbPatient.firstName} ${dbPatient.lastName}` : "Not Found");
  }

  await mongoose.disconnect();
}

run();
