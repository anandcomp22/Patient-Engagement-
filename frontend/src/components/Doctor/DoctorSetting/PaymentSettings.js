import React from "react";
import { TextField, Button, Box } from "@mui/material";

const PaymentSettings = () => (
  <Box>
    <h3>Payment Preferences</h3>
    <TextField fullWidth label="Consultation Fee (₹)" margin="normal" />
    <TextField fullWidth label="UPI ID / Bank Details" margin="normal" />
    <Button variant="contained" color="primary">Update</Button>
  </Box>
);

export default PaymentSettings;
