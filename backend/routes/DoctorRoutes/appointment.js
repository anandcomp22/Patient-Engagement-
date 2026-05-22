const express = require('express');
const router = express.Router();
const { Appointment, videocall, Patient, Doctor } = require('../../db/models');
require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("[Stripe Error] STRIPE_SECRET_KEY is missing from .env!");
} else {
  console.log("[Stripe] Key loaded:", process.env.STRIPE_SECRET_KEY.substring(0, 7) + "...");
}
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
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const bookedAppointments = await Appointment.find({
      doctorId: dId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      // Optionally ignore cancelled / dropped appointments
      $or: [
        { appstatus: { $in: ["confirmed", "Appointment Done", "completed"] } },
        { 
          appstatus: "pending", 
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } 
        }
      ]
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
    console.log("[Booking Debug] Request Body:", req.body);
    console.log("[Booking Debug] User from Token:", req.user);

    // Use securely verified patientId from the token if available, otherwise fallback to frontend's provided ID
    const dId = Number(doctorId) || Number(req.user.doctorId);
    const pId = req.user.patientId ? Number(req.user.patientId) : Number(patientId);

    if (!pId || isNaN(pId)) {
      console.error("[Booking Error] Invalid Patient ID:", { pId, user: req.user });
      return res.status(400).json({ 
        message: "Invalid or missing Patient ID. Please ensure you are logged in as a patient." 
      });
    }

    if (!dId || isNaN(dId)) {
      return res.status(400).json({ message: "Invalid or missing Doctor ID." });
    }

    const doctor = await Doctor.findOne({ doctorId: dId });
    const patient = await Patient.findOne({ patientId: pId });

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    if (!patient) return res.status(404).json({ message: "Patient not found" });


    const exists = await Appointment.findOne({
      doctorId: dId,
      startTime: time,
      appointmentDate: new Date(appointmentDate),
      appstatus: { $ne: "cancelled" }
    });

    if (exists) {
      if (exists.paymentstatus === "paid") {
        return res.status(409).json({ message: "Slot already booked and paid." });
      }
      // If pending, clean up old record to allow retry
      await Appointment.deleteOne({ _id: exists._id });
      await videocall.deleteOne({ appointmentId: exists._id });
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
      appstatus: "pending",
      paymentstatus: "pending"
    });

    const videocallEntry = await videocall.create({
      appointmentId: appointment._id,
      doctorId: dId,
      patientId: pId,
      roomId,
      appstatus: "pending"
    });

    const amount = 1499; // Hardcoded ₹500 fee
    let frontendUrl = process.env.FRONTEND_URL || "3000";
    if (!frontendUrl.toString().startsWith('http')) {
      frontendUrl = `http://localhost:${frontendUrl}`;
    }

    const successUrl = `${frontendUrl}/patient/book?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointment.appointmentId.toString()}&payment_success=true`;
    const cancelUrl = `${frontendUrl}/patient/book?appointmentId=${appointment.appointmentId.toString()}&payment_cancel=true`;

    console.log("[Stripe] Creating session URL check:", { successUrl, cancelUrl });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Consultation with Dr. ${doctor.firstName} ${doctor.lastName}`,
              description: `Appointment on ${formattedDate} at ${time}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        appointmentId: appointment.appointmentId.toString(),
      },
    });

    const io = req.app.get("io");
    io.emit("appointment-updated");

    // Send real-time notifications for new booking
    await sendNotification(io, dId.toString(), "doctor", "New Appointment Booked", `${patient.firstName} ${patient.lastName} booked an appointment on ${appointmentDate} at ${time}.`);
    await sendNotification(io, "admin", "admin", "New Appointment", `${patient.firstName} ${patient.lastName} booked with Dr. ${doctor.firstName} ${doctor.lastName} on ${appointmentDate}.`);

    res.status(201).json({
      success: true,
      message: "Appointment created. Please complete payment.",
      appointment,
      paymentUrl: session.url,
      roomId: videocallEntry.roomId
    });

  } catch (err) {
    console.error("Appointment booking error:", {
      message: err.message,
      stack: err.stack,
      stripeError: err.raw || err
    });
    res.status(500).json({ message: "Failed to book appointment", details: err.message });
  }
});

// ── Confirm payment after Stripe success redirect ──
router.post('/confirm-payment', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ message: "appointmentId is required" });

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { paymentstatus: "paid" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // Create a FeePay record for payment history
    await FeePay.create({
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      patientname: appointment.patientName,
      doctorname: appointment.doctorName,
      fees: 100,
      paymentmethod: "Stripe",
      paymentstatus: "paid"
    });

    const io = req.app.get("io");

    // Notify Doctor
    await sendNotification(
      io,
      appointment.doctorId.toString(),
      "doctor",
      "Payment Received 💰",
      `₹100 received from ${appointment.patientName} for appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}.`
    );

    // Notify Admin
    await sendNotification(
      io,
      "admin",
      "admin",
      "New Payment Recorded 💳",
      `₹100 paid by ${appointment.patientName} to ${appointment.doctorName} via Stripe.`
    );

    // Notify Patient (receipt confirmation)
    await sendNotification(
      io,
      appointment.patientId.toString(),
      "patient",
      "Payment Successful ✅",
      `Your ₹100 payment to ${appointment.doctorName} was successful. Your appointment is confirmed.`
    );

    // Broadcast to admin payments page for live table update
    io.emit("payment-updated");
    io.emit("appointment-updated");

    res.json({ success: true, message: "Payment confirmed", appointment });
  } catch (err) {
    console.error("Confirm payment error:", err);
    res.status(500).json({ message: "Failed to confirm payment" });
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



router.post("/finalize", authMiddleware, async (req, res) => {
  const { appointmentId, sessionId } = req.body; // Accept sessionId too
  try {
    const appt = await Appointment.findOne({ appointmentId: appointmentId });
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    
    // If not paid in DB yet, check Stripe directly (Resilience)
    if (appt.paymentstatus !== "paid" && sessionId) {
      console.log("[Finalize] Checking Stripe directly for session:", sessionId);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        appt.paymentstatus = "paid";
        await appt.save();
      }
    }

    if (appt.paymentstatus !== "paid") {
      return res.status(400).json({ message: "Payment not verified yet by Stripe." });
    }

    appt.appstatus = "confirmed";
    await appt.save();

    console.log("[Finalize] Appointment confirmed in DB:", appt.appointmentId);

    // Trigger email helper (Non-blocking background task)
    const { sendAppointmentConfirmation } = require("../../utils/appointmentHelpers");
    sendAppointmentConfirmation(appt).catch(err => console.error("Background Email Error:", err));

    // Safety check for socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("appointment-updated");
    }

    res.json({ success: true, message: "Appointment confirmed!", appointment: appt });
  } catch (err) {
    console.error("[Finalize Error] Full Stack Trace:", err);
    res.status(500).json({ 
      message: "Error finalizing appointment", 
      details: err.message 
    });
  }
});

module.exports = router;
