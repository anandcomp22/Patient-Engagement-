import React, { useState, useEffect } from "react";
import { Button, Box, Grid, FormControlLabel, Checkbox, Typography, Divider, Alert, Snackbar, CircularProgress } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STANDARD_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

const AvailabilitySettings = ({ availability, onRefresh }) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (availability) {
      setSelectedDays(availability.days || []);
      setSelectedSlots(availability.slots || []);
    }
  }, [availability]);

  const handleDayChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSlotChange = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSelectAllDays = () => {
    if (selectedDays.length === DAYS_OF_WEEK.length) {
      setSelectedDays([]);
    } else {
      setSelectedDays([...DAYS_OF_WEEK]);
    }
  };

  const handleSelectAllSlots = () => {
    if (selectedSlots.length === STANDARD_SLOTS.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots([...STANDARD_SLOTS]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/availability`,
        { days: selectedDays, slots: selectedSlots },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({
        open: true,
        message: res.data.message || "Availability settings saved successfully!",
        severity: "success",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update availability settings.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold" }}>
        📅 Schedule Work Days
      </Typography>
      <Button size="small" onClick={handleSelectAllDays} sx={{ mb: 1, textTransform: "none" }}>
        {selectedDays.length === DAYS_OF_WEEK.length ? "Deselect All Days" : "Select All Days"}
      </Button>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {DAYS_OF_WEEK.map((day) => (
          <Grid item xs={6} sm={4} md={3} key={day}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedDays.includes(day)}
                  onChange={() => handleDayChange(day)}
                  color="primary"
                />
              }
              label={day}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom sx={{ color: "#1E5DA9", fontWeight: "bold" }}>
        ⏰ Select Available Time Slots
      </Typography>
      <Button size="small" onClick={handleSelectAllSlots} sx={{ mb: 1, textTransform: "none" }}>
        {selectedSlots.length === STANDARD_SLOTS.length ? "Deselect All Slots" : "Select All Slots"}
      </Button>
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {STANDARD_SLOTS.map((slot) => (
          <Grid item xs={6} sm={4} md={3} key={slot}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSlots.includes(slot)}
                  onChange={() => handleSlotChange(slot)}
                  color="primary"
                />
              }
              label={slot}
            />
          </Grid>
        ))}
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving}
        sx={{ px: 4, py: 1.2, fontWeight: "bold", mt: 1 }}
      >
        {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save Availability"}
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

export default AvailabilitySettings;