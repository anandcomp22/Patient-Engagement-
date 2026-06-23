import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Select, MenuItem, InputLabel, FormControl, Typography, Alert, Snackbar, CircularProgress } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const VideoCallSettings = ({ videoCall, onRefresh }) => {
  const [preferredPlatform, setPreferredPlatform] = useState("Zoom");
  const [meetingLinkTemplate, setMeetingLinkTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (videoCall) {
      setPreferredPlatform(videoCall.preferredPlatform || "Zoom");
      setMeetingLinkTemplate(videoCall.meetingLinkTemplate || "");
    }
  }, [videoCall]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/videocall`,
        { preferredPlatform, meetingLinkTemplate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        open: true,
        message: res.data.message || "Video call preferences saved!",
        severity: "success",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update video call settings.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold", mb: 2 }}>
        📹 Video Consultation Platform
      </Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel id="platform-select-label">Preferred Platform</InputLabel>
        <Select
          labelId="platform-select-label"
          value={preferredPlatform}
          label="Preferred Platform"
          onChange={(e) => setPreferredPlatform(e.target.value)}
        >
          <MenuItem value="Zoom">Zoom</MenuItem>
          <MenuItem value="Google Meet">Google Meet</MenuItem>
          <MenuItem value="Microsoft Teams">Microsoft Teams</MenuItem>
          <MenuItem value="In-App Video Call">In-App Telehealth Video</MenuItem>
          <MenuItem value="Custom">Custom Link</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Default Meeting Link / Template"
        margin="normal"
        value={meetingLinkTemplate}
        onChange={(e) => setMeetingLinkTemplate(e.target.value)}
        placeholder="https://zoom.us/j/your-meeting-id"
        helperText="Enter a persistent meeting URL or link template if using a third-party platform."
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
        sx={{ mt: 3, px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save Configuration"}
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

export default VideoCallSettings;