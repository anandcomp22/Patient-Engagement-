import React from 'react';
import PayPalButton from '../components/PayPalButton';

const PayPalPaymentPage = () => {
  return (
    <div>
      <h2>Pay with PayPal</h2>
      <PayPalButton amount="10.00" />
    </div>
  );
};

export default PayPalPaymentPage;
