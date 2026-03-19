const express = require('express');
const router = express.Router();
const { Appointment, videocall, Patient, Doctor } = require('../../db/models'); 
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../../middleware/authMiddleware');

/*router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const appointments = await Appointment.find({ doctorId }).sort({ date: -1 });
    return res.status(200).json(appointments);
    
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch appointments", err });
  }
});*/

router.get('/app', authMiddleware, async (req, res) => {
  console.log(" /appointment route hit");
  try {
    console.log("Decoded user in appointment route:", req.user);
    const doctorId = Number(req.user.doctorId);
    const appointments = await Appointment.find({ doctorId }).sort({ appointmentDate: -1 });
    return res.status(200).json(appointments);
    
  } catch (err) {
    console.error("Error fetching appointments:", err);
    return res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

router.get('/available-slots', authMiddleware, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    // Standard available slots in a day (could be customized per doctor later)
    const ALL_SLOTS = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
      "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", 
      "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", 
      "04:00 PM", "04:30 PM", "05:00 PM"
    ];

    // Find booked appointments for this doctor on the selected date
    const dId = Number(doctorId);
    const queryDate = new Date(date);
    
    // We only filter by starting date; time is handled separately
    const startOfDay = new Date(queryDate.setHours(0,0,0,0));
    const endOfDay = new Date(queryDate.setHours(23,59,59,999));

    const bookedAppointments = await Appointment.find({
      doctorId: dId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      // Optionally ignore cancelled / dropped appointments
      appstatus: { $in: ["confirmed", "pending", "Appointment Done", "completed"] }
    });

    const bookedTimes = bookedAppointments.map(app => app.startTime);
    const availableSlots = ALL_SLOTS.filter(slot => !bookedTimes.includes(slot));

    return res.status(200).json({ availableSlots });

  } catch (err) {
    console.error("Error fetching available slots:", err);
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
});

router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { appointmentDate, patientId, time, reason, doctorId } = req.body;

    // Use securely verified patientId from the token if available, otherwise fallback to frontend's provided ID
    const dId = Number(doctorId) || Number(req.user.doctorId);
    const pId = req.user.patientId ? Number(req.user.patientId) : Number(patientId);

    if (!dId || isNaN(dId)) {
      return res.status(400).json({ message: "Invalid doctorId" });
    }

    const doctor = await Doctor.findOne({ doctorId: dId });
    const patient = await Patient.findOne({ patientId: pId });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const exists = await Appointment.findOne({
      doctorId: dId,
      startTime: time,
      appointmentDate: new Date(appointmentDate)
    });

    if (exists) {
      return res.status(409).json({ message: "Slot already booked" });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      patientId: pId,
      doctorId: dId,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      patientAge: new Date().getFullYear() - new Date(patient.dob).getFullYear(),
      appointmentDate: new Date(appointmentDate),
      startTime: time,
      endTime: "30 mins",
      reason: reason || "General Checkup",
      appstatus: "confirmed",
      paymentstatus: "pending"
    });

    const videocallEntry = await videocall.create({
      appointmentId: appointment._id,
      doctorId: dId,
      patientId: pId,
      roomId: uuidv4(),
      appstatus: "confirmed"
    });

    req.app.get("io").emit("appointment-updated");

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
      roomId: videocallEntry.roomId
    });

  } catch (err) {
    console.error("Appointment booking error:", err);
    res.status(500).json({ message: "Failed to book appointment" });
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

  router.post("/reschedule", async (req, res) => {
    const { appointmentId, newSlotId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    await Slot.findByIdAndUpdate(appointment.slotId, {
      status: "AVAILABLE"
    });

    const newSlot = await Slot.findOne({
      _id: newSlotId,
      status: "AVAILABLE"
    });

    if (!newSlot) return res.status(400).json({ message: "Slot busy" });

    newSlot.status = "BOOKED";
    await newSlot.save();

    appointment.slotId = newSlotId;
    appointment.status = "RESCHEDULED";
    await appointment.save();

    res.json({ message: "Rescheduled", appointment });
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
