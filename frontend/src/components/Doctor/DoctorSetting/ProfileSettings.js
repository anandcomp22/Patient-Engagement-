import React, { useState, useEffect } from "react";
import { TextField, Button, Box, Grid, Alert, Snackbar, CircularProgress } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const ProfileSettings = ({ profile, onRefresh }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialty: "",
    qualifications: "",
    experience: "",
    hospital: "",
    country: "",
    state: "",
    district: "",
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        specialty: profile.specialty || "",
        qualifications: Array.isArray(profile.qualifications) 
          ? profile.qualifications.join(", ") 
          : profile.qualifications || "",
        experience: profile.experience || "",
        hospital: profile.hospital || "",
        country: profile.country || "",
        state: profile.state || "",
        district: profile.district || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE}/doctor/settings/profile`,
        {
          ...formData,
          qualifications: formData.qualifications
            .split(",")
            .map((q) => q.trim())
            .filter((q) => q.length > 0),
          experience: Number(formData.experience)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local storage names if changed
      const fullName = `Dr. ${formData.firstName} ${formData.lastName}`;
      localStorage.setItem("doctorName", fullName);
      localStorage.setItem("doctorEmail", formData.email);

      setFeedback({
        open: true,
        message: res.data.message || "Profile updated successfully!",
        severity: "success",
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setFeedback({
        open: true,
        message: err.response?.data?.message || "Failed to update profile settings.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Specialty"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Qualifications (comma separated)"
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            placeholder="MBBS, MD, FRCS"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            type="number"
            label="Experience (Years)"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            required
            label="Hospital / Clinic"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            label="District"
            name="district"
            value={formData.district}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={saving}
        sx={{ mt: 3, px: 4, py: 1.2, fontWeight: "bold" }}
      >
        {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save Changes"}
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

export default ProfileSettings;