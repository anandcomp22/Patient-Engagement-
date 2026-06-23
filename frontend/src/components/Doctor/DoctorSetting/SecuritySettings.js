import React, { useState } from "react";
import { TextField, Button, Box, Alert, Snackbar, CircularProgress, Typography } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const SecuritySettings = ({ onRefresh }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ open: true, message: "New passwords do not match!", severity: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ open: true, message: "Password must be at least 6 characters long.", severity: "error" });
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/security`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        open: true,
        message: res.data.message || "Password updated successfully!",
        severity: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update password. Please check your current password.",
        severity: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold", mb: 2 }}>
        🔒 Change Password
      </Typography>

      <TextField
        fullWidth
        required
        type="password"
        label="Current Password"
        margin="normal"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <TextField
        fullWidth
        required
        type="password"
        label="New Password"
        margin="normal"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <TextField
        fullWidth
        required
        type="password"
        label="Confirm New Password"
        margin="normal"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={updating}
        sx={{ mt: 3, px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {updating ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Update Password"}
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

export default SecuritySettings;