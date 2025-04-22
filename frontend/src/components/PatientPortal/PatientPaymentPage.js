import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, Divider } from '@mui/material';
import { AccountBalanceWallet, History, Payment } from '@mui/icons-material';
import PayPalButton from '../components/PayPalButton'; // You must have this file

const PatientPaymentPage = () => {
  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Typography variant="h4" sx={{ color: '#1E5DA9', mb: 4 }}>
        Payment Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Make a Payment */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderLeft: '4px solid #1E5DA9', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Make a Payment</Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Securely pay your consultation or prescription fees.
              </Typography>
              <PayPalButton amount="20.00" />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                PayPal will open a secure checkout window.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet or Balance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderLeft: '4px solid #1E5DA9', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWallet sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Your Wallet</Typography>
              </Box>
              <Typography variant="body1">Current Balance: ₹0.00</Typography>
              <Button variant="outlined" sx={{ mt: 2, color: '#1E5DA9', borderColor: '#1E5DA9' }}>
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid item xs={12}>
          <Card sx={{ borderLeft: '4px solid #1E5DA9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <History sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Payment History</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2">• ₹500.00 - Consultation with Dr. Smith - 12/04/2025</Typography>
              <Typography variant="body2">• ₹300.00 - Prescription refill - 01/04/2025</Typography>
              <Typography variant="body2">• ₹200.00 - Lab test fees - 22/03/2025</Typography>
              <Button variant="text" sx={{ color: '#1E5DA9', mt: 2 }}>
                View All Transactions
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientPaymentPage;
