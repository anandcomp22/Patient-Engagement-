import React, { useState } from "react";
import { Button, Box, Typography, TextField, Alert, Snackbar, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const DeleteAccount = () => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "error" });
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setFeedback({ open: true, message: "Please type DELETE to confirm deactivation.", severity: "error" });
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_BASE}/doctor/settings/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFeedback({
        open: true,
        message: res.data.message || "Account deactivated successfully.",
        severity: "success",
      });

      // Clear doctor session data
      localStorage.removeItem("token");
      localStorage.removeItem("doctorName");
      localStorage.removeItem("doctorEmail");
      localStorage.removeItem("doctorId");

      setTimeout(() => {
        // Redirect to homepage
        navigate("/");
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to deactivate account.",
        severity: "error",
      });
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: "bold" }}>
        ⚠️ Danger Zone: Deactivate Account
      </Typography>
      <Typography sx={{ mb: 2, color: "text.secondary" }}>
        Deactivating your account will make your profile invisible to new patients and prevent any new bookings. 
        Your past consultation records, prescriptions, and appointment histories will be safely retained for medical and regulatory compliance.
      </Typography>

      <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
        To confirm deactivation, please type <span style={{ color: "red" }}>DELETE</span> below:
      </Typography>
      <TextField
        fullWidth
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        margin="normal"
      />

      <Button
        variant="contained"
        color="error"
        onClick={handleDelete}
        disabled={deleting || confirmText !== "DELETE"}
        sx={{ mt: 2, px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {deleting ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Deactivate My Account"}
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

export default DeleteAccount;