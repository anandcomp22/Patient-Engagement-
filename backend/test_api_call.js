const axios = require("axios");
const { Doctor } = require("./db/models");
const mongoose = require("mongoose");
const { generateToken } = require("./utils/auth");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to DB");

    const doctor = await Doctor.findOne();
    if (!doctor) {
      console.log("No doctor found");
      await mongoose.disconnect();
      return;
    }

    const token = generateToken(doctor, "doctor");
    console.log("Generated Token:", token.substring(0, 15) + "...");

    // Make local HTTP call to backend
    try {
      const res = await axios.get("http://localhost:8000/api/analytics/doctor-overview", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("API Success Response:", res.data);
    } catch (err) {
      console.error("API Request Failed!");
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      } else {
        console.error("Message:", err.message);
      }
    }

  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
