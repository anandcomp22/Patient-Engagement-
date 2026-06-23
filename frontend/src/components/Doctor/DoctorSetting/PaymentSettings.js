import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Typography, Alert, Snackbar, CircularProgress } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PaymentSettings = ({ payment, onRefresh }) => {
  const [consultationFee, setConsultationFee] = useState(500);
  const [upiId, setUpiId] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (payment) {
      setConsultationFee(payment.consultationFee || 500);
      setUpiId(payment.upiId || "");
    }
  }, [payment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/payment`,
        { consultationFee, upiId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        open: true,
        message: res.data.message || "Payment preferences updated!",
        severity: "success",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update payment settings.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold", mb: 2 }}>
        💳 Payment Preferences & Consultation Fees
      </Typography>

      <TextField
        fullWidth
        required
        type="number"
        label="Consultation Fee (₹)"
        margin="normal"
        value={consultationFee}
        onChange={(e) => setConsultationFee(Number(e.target.value))}
      />
      <TextField
        fullWidth
        label="UPI ID or Bank Details"
        margin="normal"
        value={upiId}
        onChange={(e) => setUpiId(e.target.value)}
        placeholder="doctorname@upi"
        helperText="Used for direct payouts and online patient settlements."
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
        sx={{ mt: 3, px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Update Preferences"}
      </Button>

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentSettings;
