import React, { useEffect, useState } from "react";
import {
   Grid, Paper, Box, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Button
} from "@mui/material";
import {
  People,
  LocalHospital,
  EventAvailable,
  CurrencyRupee,
  Warning,
  Videocam
} from "@mui/icons-material";
import axios from "axios";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [appointments, setAppointments] = useState([]);
  
  const ADMIN_TOKEN = localStorage.getItem("adminToken");

  const fetchAppointments = async () => {
  const res = await axios.get(
    "http://localhost:8000/admin/appointments",
    {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`
      }
    }
  );
  setAppointments(res.data);
};

  const updateStatus = async (id, status) => {
    await axios.patch(
      `http://localhost:8000/admin/appointments/${id}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      }
    );
    fetchAppointments();
  };

  const fetchMetrics = async () => {
    const res = await axios.get(
      "http://localhost:8000/admin/dashboard/metrics",
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      }
    );
    setMetrics(res.data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchAppointments();
        await fetchMetrics();
      } catch (err) {
        console.error("ADMIN DASHBOARD ERROR:", err);
      }
    };
    loadData();
  }, []);


  const cards = [
    { title: "Total Doctors", value: metrics.doctors, icon: <LocalHospital />, color: "#E3F2FD" },
    { title: "Total Patients", value: metrics.patients, icon: <People />, color: "#E8F5E9" },
    { title: "Appointments", value: metrics.appointments, icon: <EventAvailable />, color: "#FFF3E0" },
    { title: "Revenue", value: `₹${metrics.revenue}`, icon: <CurrencyRupee />, color: "#F3E5F5" },
    { title: "Pending Doctors", value: metrics.pendingDoctors, icon: <Warning />, color: "#FCE4EC" },
    { title: "Active Calls", value: metrics.activeCalls, icon: <Videocam />, color: "#E1F5FE" }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "#1E5DA9" }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper sx={{
              backgroundColor: card.color,
              p: 2,
              borderRadius: "16px",
              textAlign: "center",
              transition: "0.3s",
              "&:hover": { transform: "translateY(-4px)" }
            }}>
              <Box sx={{
                width: 50, height: 50, bgcolor: "#fff",
                borderRadius: "50%", mx: "auto",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {card.icon}
              </Box>
              <Typography sx={{ mt: 1, fontWeight: 600 }}>
                {card.title}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {card.value || 0}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
