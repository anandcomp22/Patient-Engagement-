const express = require('express');
const router = express.Router();
const { Appointment, videocall, Patient } = require('../db/models'); 
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

router.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.post('/book', authMiddleware, async (req, res) => {
    try {
        const { date, patientId, doctorId } = req.body;

        const appointmentId = Math.floor(Math.random() * 100000); 
        const roomId = uuidv4();

        const appointment = new Appointment({
            appointmentId,
            date,
            patientId,
            doctorId,
            appstatus: 'confirmed',
            paymentstatus: 'paid'
        });

        const videocallEntry = new videocall({
            appointmentId,
            patientId,
            doctorId,
            roomId,
            appstatus: 'confirmed',
        });

        await appointment.save();
        await videocallEntry.save();

        res.status(201).json({ success: true, message: "Appointment booked", appointmentId, roomId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to book appointment" });
    }
});

router.get("/details/:appointmentId", async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ appointmentId: req.params.appointmentId });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const patient = await Patient.findOne({ patientId: appointment.patientId });
    res.status(200).json({
      ...appointment.toObject(),
      patientDetails: {
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching appointment details" });
  }
});

router.delete("/delete/:appointmentId", async (req, res) => {
  try {
    await Appointment.deleteOne({ appointmentId: Number(req.params.appointmentId) });
    await videocall.deleteOne({ appointmentId: Number(req.params.appointmentId) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});


router.put("/complete/:appointmentId", async (req, res) => {
  try {
    const updated = await Appointment.findOneAndUpdate(
      { appointmentId: req.params.appointmentId },
      { appstatus: "Appointment Done" },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.put('/reschedule', async (req, res) => {
    const { appointmentId, newDate } = req.body;
  
    try {
      const updated = await Appointment.findOneAndUpdate(
        { appointmentId: Number(appointmentId) },
        { date: new Date(newDate) },
        { new: true }
      );
  
      if (!updated) return res.status(404).json({ success: false, message: "Appointment not found" });
  
      res.status(200).json({ success: true, updated });
    } catch (err) {
      console.error("Error during reschedule:", err);
      res.status(500).json({ success: false, message: "Error rescheduling" });
    }
  });
  

router.get('/room/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const entry = await videocall.findOne({ appointmentId: Number(appointmentId) });
    if (!entry) return res.status(404).json({ message: "Room not found" });

    const patient = await Patient.findOne({ patientId: entry.patientId });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const patientDetails = {
      name: `${patient.firstName} ${patient.lastName}`,
      email: patient.email,
      contact: patient.phone,
      age: patient.age,
      address: `${patient.district}, ${patient.state}, ${patient.country}`,
      patientId: patient.patientId,
    };

    res.status(200).json({ roomId: entry.roomId, patient: patientDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching room and patient data" });
  }
});



module.exports = router;
