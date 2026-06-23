import React, { useState, useEffect } from "react";
import { FormControlLabel, Switch, Box, Button, Typography, Alert, Snackbar, CircularProgress } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const NotificationSettings = ({ notifications, onRefresh }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (notifications) {
      setEmailNotifications(notifications.emailNotifications !== false);
      setSmsNotifications(notifications.smsNotifications !== false);
    }
  }, [notifications]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/notifications`,
        { emailNotifications, smsNotifications },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        open: true,
        message: res.data.message || "Notification preferences saved!",
        severity: "success",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update notification settings.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold", mb: 2 }}>
        🔔 Notification Preferences
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              color="primary"
            />
          }
          label="Email Notifications (Patient appointments, reminders)"
        />
        <FormControlLabel
          control={
            <Switch
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
              color="primary"
            />
          }
          label="SMS Notifications (Immediate patient queue alerts)"
        />
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
        sx={{ px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save Preferences"}
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

export default NotificationSettings;
