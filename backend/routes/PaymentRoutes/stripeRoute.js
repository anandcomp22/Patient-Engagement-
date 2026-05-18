const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Appointment } = require('../../db/models');

const FRONTEND_URL = process.env.FRONTEND_URL ? `http://localhost:${process.env.FRONTEND_URL}` : 'http://localhost:3000';

router.post('/create-checkout-session', async (req, res) => {
  try {
    const { appointmentId, doctorName, date, time, roomId } = req.body;
    
    // We expect the frontend to provide the appointment details
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    // A static consultation fee of ₹100 for demonstration. Can be dynamic.
    const consultationFee = 100 * 100; // in paise

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Consultation with ${doctorName || 'Doctor'}`,
              description: `Appointment on ${date} at ${time}`,
            },
            unit_amount: consultationFee,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Send user back to the frontend booking page on success with URL params to show the success popup
      success_url: `${FRONTEND_URL}/patient/book?success=true&appointmentId=${appointmentId}&roomId=${roomId}&docName=${encodeURIComponent(doctorName || '')}&date=${date}&time=${time}`,
      // Or go back to booking with canceled=true
      cancel_url: `${FRONTEND_URL}/patient/book?canceled=true`,
      metadata: {
        appointmentId,
        roomId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// A simple webhook route to mark appointment as paid (Optional if needed)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata.appointmentId;
    
    // Update appointment paymentstatus to "paid"
    if(appointmentId) {
       await Appointment.findByIdAndUpdate(appointmentId, { paymentstatus: 'paid' });
    }
  }

  res.status(200).end();
});

module.exports = router;
