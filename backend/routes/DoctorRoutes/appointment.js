const express = require('express');
const router = express.Router();
const { Appointment, videocall, Patient, Doctor } = require('../../db/models'); 
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../../middleware/authMiddleware');
const { sendEmail } = require('../../utils/mailer');

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

    const roomId = uuidv4();
    const patientName = `${patient.firstName} ${patient.lastName}`;
    const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
    const formattedDate = new Date(appointmentDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const appointment = await Appointment.create({
      patient: patient._id,
      patientId: pId,
      doctorId: dId,
      doctorName,
      patientName,
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
      roomId,
      appstatus: "confirmed"
    });

    req.app.get("io").emit("appointment-updated");

    // ── Send Confirmation Emails ──
    const videoLink = `${process.env.FRONTEND_URL ? `http://localhost:${process.env.FRONTEND_URL}` : "http://localhost:3000"}/patient/video-call?roomId=${roomId}`;
    const doctorVideoLink = `${process.env.FRONTEND_URL ? `http://localhost:${process.env.FRONTEND_URL}` : "http://localhost:3000"}/doctor/video-call?roomId=${roomId}&patientEmail=${encodeURIComponent(patient.email)}&patientName=${encodeURIComponent(patientName)}&patientId=${pId}`;

    // Email to Patient
    try {
      await sendEmail(
        patient.email,
        `Appointment Confirmed — ${doctorName} on ${formattedDate}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;border:1px solid #e2e8f0;padding:24px;border-radius:12px;">
          <h2 style="color:#1E5DA9;margin-bottom:4px;">AidME Healthcare</h2>
          <p style="color:#64748b;margin-top:0;">Appointment Confirmation</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;"/>
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#64748b;">Doctor</td><td style="padding:8px 0;font-weight:700;">${doctorName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Specialty</td><td style="padding:8px 0;">${doctor.specialty}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:700;">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;font-weight:700;">${time}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;">${reason || "General Checkup"}</td></tr>
          </table>
          <a href="${videoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">Join Video Consultation</a>
          <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px;">The join link will be active at your scheduled time. You'll also receive a reminder 10 minutes before.</p>
        </div>`
      );
    } catch (emailErr) {
      console.error("[Booking] Patient confirmation email failed:", emailErr.message);
    }

    // Email to Doctor
    try {
      await sendEmail(
        doctor.email,
        `New Appointment: ${patientName} on ${formattedDate} at ${time}`,
        `<div style="font-family:Arial,sans-serif;max-width:600px;border:1px solid #e2e8f0;padding:24px;border-radius:12px;">
          <h2 style="color:#1E5DA9;">New Appointment Scheduled</h2>
          <p>A new consultation has been booked for you:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px 0;color:#64748b;">Patient</td><td style="padding:8px 0;font-weight:700;">${patientName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:700;">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;font-weight:700;">${time}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;">${reason || "General Checkup"}</td></tr>
          </table>
          <a href="${doctorVideoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Join Call (at scheduled time)</a>
        </div>`
      );
    } catch (emailErr) {
      console.error("[Booking] Doctor confirmation email failed:", emailErr.message);
    }

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

  router.put("/reschedule", authMiddleware, async (req, res) => {
    try {
      const { appointmentId, newDate } = req.body;
      const dateObj = new Date(newDate);
      
      const formattedTime = dateObj.toLocaleTimeString("en-US", { 
        hour: "2-digit", minute: "2-digit", hour12: true 
      });

      const updated = await Appointment.findOneAndUpdate(
        { appointmentId: Number(appointmentId) },
        { 
          appointmentDate: dateObj,
          startTime: formattedTime,
          appstatus: "Rescheduled"
        },
        { new: true }
      );
      
      if (!updated) {
        // Fallback to _id just in case
        const altUpdated = await Appointment.findByIdAndUpdate(
          appointmentId,
          { appointmentDate: dateObj, startTime: formattedTime, appstatus: "Rescheduled" },
          { new: true }
        );
        if (!altUpdated) return res.status(404).json({ message: "Not found" });
      }

      req.app.get("io").emit("appointment-updated");
      res.json({ message: "Rescheduled", success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error rescheduling" });
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
