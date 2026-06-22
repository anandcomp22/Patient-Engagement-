const express = require("express");
const Stripe = require("stripe");
const { Appointment, FeePay, Patient, Doctor, videocall } = require("../../db/models");
const { sendAppointmentConfirmation } = require("../../utils/appointmentHelpers");
require("dotenv").config();

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// 1. Create a Checkout Session
router.post("/create-checkout-session", async (req, res) => {
  const { appointmentId, amount, doctorName, patientName } = req.body;

  try {
    const frontendUrl = process.env.FRONTEND_URL ? (process.env.FRONTEND_URL.startsWith('http') ? process.env.FRONTEND_URL : `http://localhost:${process.env.FRONTEND_URL}`) : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr", // or "usd"
            product_data: {
              name: `Consultation with Dr. ${doctorName}`,
              description: `Appointment for ${patientName}`,
            },
            unit_amount: Math.round(amount * 100), // amount in paisa/cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${frontendUrl}/patient/booking-success?session_id={CHECKOUT_SESSION_ID}&appointmentId=${appointmentId}`,
      cancel_url: `${frontendUrl}/patient/booking-cancel?appointmentId=${appointmentId}`,
      metadata: {
        appointmentId,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Session Error:", err);
    res.status(500).json({ message: "Payment initiation failed" });
  }
});

// 2. Verify Payment (Simplified Success Handler)
router.get("/verify-payment", async (req, res) => {
  const { session_id, appointmentId } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Update Appointment
      const appt = await Appointment.findOneAndUpdate(
        { appointmentId: appointmentId },
        { paymentstatus: "paid", appstatus: "confirmed" },
        { new: true }
      );

      if (appt) {
        // Create/Update FeePay record
        await FeePay.create({
          patientId: appt.patientId,
          patientname: appt.patientName,
          doctorId: appt.doctorId,
          doctorname: appt.doctorName,
          paymentstatus: "paid",
          paymentmethod: "stripe",
          fees: session.amount_total / 100,
          transactionId: session.id,
        });

        // Fetch details for email
        const patient = await Patient.findOne({ patientId: appt.patientId });
        const doctor = await Doctor.findOne({ doctorId: appt.doctorId });
        const vc = await videocall.findOne({ appointmentId: appt._id });

        if (patient && doctor && vc) {
          await sendAppointmentConfirmation(appt, patient, doctor, vc.roomId);
        }
      }

      res.json({ success: true, message: "Payment verified and appointment confirmed" });
    } else {
      res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

// 3. Handle Payment Cancellation
router.post("/cancel-payment", async (req, res) => {
  const { appointmentId } = req.body;
  try {
    await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      { appstatus: "cancelled" }
    );
    res.json({ success: true, message: "Appointment cancelled and slot released" });
  } catch (err) {
    console.error("Payment Cancellation Error:", err);
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

module.exports = router;
