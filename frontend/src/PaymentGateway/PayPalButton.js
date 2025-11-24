import React, { useEffect } from 'react';

const PayPalButton = ({ amount }) => {
  useEffect(() => {
    window.paypal.Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount,
            },
          }],
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          alert('Payment successful by ' + details.payer.name.given_name);
          // Store details if needed
        });
      },
    }).render('#paypal-button-container');
  }, [amount]);

  return <div id="paypal-button-container" />;
};

export default PayPalButton;
