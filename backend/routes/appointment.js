const express = require('express');
const router = express.Router();
const { Appointment, videocall } = require('../db/models'); 
const { v4: uuidv4 } = require('uuid'); 

router.post('/book', async (req, res) => {
    try {
        const { date, patientId, doctorId } = req.body;

        const appointmentId = Date.now();
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

router.get('/room/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  const { videocall } = require("../db/models");

  try {
      const entry = await videocall.findOne({ appointmentId: Number(appointmentId) });
      if (!entry) return res.status(404).json({ message: "Room not found" });

      res.status(200).json({ roomId: entry.roomId });
  } catch (err) {
      res.status(500).json({ message: "Error fetching room ID" });
  }
});


module.exports = router;
