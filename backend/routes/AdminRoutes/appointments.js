const express = require("express");
const router = express.Router();
const { Appointment, Doctor, Patient } = require("../../db/models");
const adminAuth = require("../../middleware/adminAuth");

router.get("/", adminAuth, async (req, res) => {
  const appointments = await Appointment.find()
    .populate("doctorId", "name email")
    .populate("patientId", "name email")
    .sort({ date: -1 });

  res.json(appointments);
});

router.patch("/:id/status", adminAuth, async (req, res) => {
  const { status } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(appointment);
});

module.exports = router;
