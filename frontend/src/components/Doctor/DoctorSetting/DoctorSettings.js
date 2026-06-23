import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, CircularProgress, Alert, Paper, Typography } from "@mui/material";
import axios from "axios";

import ProfileSettings from "./ProfileSettings";
import AvailabilitySettings from "./AvailabilitySettings";
import SecuritySettings from "./SecuritySettings";
import NotificationSettings from "./NotificationSettings";
import VideoCallSettings from "./VideoCallSettings";
import PaymentSettings from "./PaymentSettings";
import DeleteAccount from "./DeleteAccount";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const DoctorSettings = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE}/doctor/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.response?.data?.message || "Failed to load doctor settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTabChange = (_, newIndex) => {
    setTabIndex(newIndex);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold", color: "#1E5DA9" }}>
        ⚙️ Settings Configuration
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            borderBottom: 1, 
            borderColor: "divider",
            backgroundColor: "#f8fafc",
            "& .MuiTab-root": { fontWeight: "bold" }
          }}
        >
          <Tab label="Profile" />
          <Tab label="Availability" />
          <Tab label="Security" />
          <Tab label="Notifications" />
          <Tab label="Video Call" />
          <Tab label="Payment" />
          <Tab label="Delete Account" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {tabIndex === 0 && <ProfileSettings profile={settings?.profile} onRefresh={fetchSettings} />}
          {tabIndex === 1 && <AvailabilitySettings availability={settings?.availability} onRefresh={fetchSettings} />}
          {tabIndex === 2 && <SecuritySettings onRefresh={fetchSettings} />}
          {tabIndex === 3 && <NotificationSettings notifications={settings?.notifications} onRefresh={fetchSettings} />}
          {tabIndex === 4 && <VideoCallSettings videoCall={settings?.videoCall} onRefresh={fetchSettings} />}
          {tabIndex === 5 && <PaymentSettings payment={settings?.payment} onRefresh={fetchSettings} />}
          {tabIndex === 6 && <DeleteAccount onRefresh={fetchSettings} />}
        </Box>
      </Paper>
    </Box>
  );
};

export default DoctorSettings;
