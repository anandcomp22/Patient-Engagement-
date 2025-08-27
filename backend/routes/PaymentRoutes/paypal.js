const express = require('express');
const paypal = require('paypal-rest-sdk');
require('dotenv').config();

const router = express.Router();

paypal.configure({
  mode: 'sandbox', 
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

router.post('/create-payment', (req, res) => {
  const create_payment_json = {
    intent: 'sale',
    payer: { payment_method: 'paypal' },
    redirect_urls: {
      return_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    },
    transactions: [{
      amount: {
        currency: 'USD',
        total: '10.00',
      },
      description: 'Medical Appointment Payment',
    }],
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    } else {
      for (let link of payment.links) {
        if (link.rel === 'approval_url') {
          return res.json({ forwardLink: link.href });
        }
      }
    }
  });
});

module.exports = router;
