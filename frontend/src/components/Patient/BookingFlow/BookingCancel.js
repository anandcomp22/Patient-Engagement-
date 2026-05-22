import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import { CancelOutlined } from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const BookingCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  useEffect(() => {
    if (appointmentId) {
      axios.post(`${API}/api/stripe/cancel-payment`, { appointmentId })
        .catch(err => console.error("Failed to release slot:", err));
    }
  }, [appointmentId]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper elevation={3} sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 500, width: '100%' }}>
        <CancelOutlined sx={{ fontSize: 80, color: "#f59e0b", mb: 2 }} />
        <Typography variant="h4" fontWeight={800} color="#1E5DA9" sx={{ mb: 1 }}>Booking Cancelled</Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>The payment process was cancelled. No charges were made, and your appointment slot has not been reserved.</Typography>
        <Button variant="contained" fullWidth size="large" onClick={() => navigate("/patient/book")} sx={{ py: 1.5, borderRadius: 2, background: "#1E5DA9", fontWeight: 700 }}>
          Back to Booking
        </Button>
      </Paper>
    </Box>
  );
};

export default BookingCancel;
