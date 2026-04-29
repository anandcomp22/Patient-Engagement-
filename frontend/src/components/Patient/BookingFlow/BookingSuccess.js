import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Paper } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");
  const appointmentId = searchParams.get("appointmentId");

  useEffect(() => {
    if (sessionId && appointmentId) {
      verifyPayment();
    } else {
      setStatus("error");
    }
  }, [sessionId, appointmentId]);

  const verifyPayment = async () => {
    try {
      const res = await axios.get(`${API}/api/stripe/verify-payment`, {
        params: { session_id: sessionId, appointmentId }
      });
      if (res.data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Verification failed", err);
      setStatus("error");
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Paper elevation={3} sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 500, width: '100%' }}>
        {status === "loading" && (
          <>
            <CircularProgress size={60} sx={{ mb: 3, color: "#1E5DA9" }} />
            <Typography variant="h5" fontWeight={700}>Verifying your payment...</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Please do not close this window.</Typography>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircleOutline sx={{ fontSize: 80, color: "#22c55e", mb: 2 }} />
            <Typography variant="h4" fontWeight={800} color="#1E5DA9" sx={{ mb: 1 }}>Booking Confirmed!</Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>Your payment was successful and your appointment has been scheduled.</Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => navigate("/patient/appointments")} sx={{ py: 1.5, borderRadius: 2, background: "#1E5DA9", fontWeight: 700 }}>
              View My Appointments
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <ErrorOutline sx={{ fontSize: 80, color: "#ef4444", mb: 2 }} />
            <Typography variant="h4" fontWeight={800} color="#ef4444" sx={{ mb: 1 }}>Verification Failed</Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>We couldn't verify your payment. If you were charged, please contact support.</Typography>
            <Button variant="outlined" fullWidth size="large" onClick={() => navigate("/patient/book")} sx={{ py: 1.5, borderRadius: 2, color: "#1E5DA9", borderColor: "#1E5DA9" }}>
              Try Booking Again
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default BookingSuccess;
