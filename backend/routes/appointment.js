const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send("Appointments API is working");
    const appointment = new Appointment({
        appointmentId,
        date,
        patientId,
        doctorId,
        appstatus: 'confirmed',
        paymentstatus: 'paid'
      });
      
      await appointment.save();
      
});

module.exports = router;
