import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Card, CardContent, Avatar, TextField, Button, Chip, Divider } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import io from "socket.io-client";


const socket = io("http://localhost:8000"); 

const Patients = () => {
  const [patients, setPatients] = useState([]);

  const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDateTime = (iso) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


  useEffect(() => {
  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:8000/doctor/patients",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchPatients();

  socket.on("newPatient", (newPatient) => {
    setPatients((prev) => [...prev, newPatient]);
  });

  return () => socket.off("newPatient");
}, []);

  return (
    <Box sx={{ padding: 3, mt: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, gap: 2 }}>
        <h2>Patients</h2>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search patients..."
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
            sx={{ width: 200 }}
          />
          <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: "none" }}>
            Filter
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
            Add Patient
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {patients.length === 0 && (
          <Card
            sx={{
              mt: 10, // spacing from top
              mx: "auto", // center horizontally
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "none",
              gap: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#e3f2fd",
                color: "#1976d2",
                width: 72,
                height: 72,
              }}
            >
              👨‍⚕️
            </Avatar>

            <Typography variant="h5" fontWeight={600} color="text.primary">
              No Patients Yet
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5, color: "gray" }}>
              You haven’t consulted or added any patients yet.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0, color: "gray" }}>
              Once a patient books an appointment, they’ll appear here automatically.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Patient
            </Button>
          </Card>
        )}
        {patients.map((patient, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              transition: "0.3s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }
            }}>
              <CardContent>

                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#1976d2", width: 52, height: 52 }}>
                    {(patient.firstName || "P")[0]}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.patientAge ?? "N/A"} yrs • {patient.gender ?? "N/A"}
                    </Typography>
                  </Box>

                  <Chip
                    label="Active"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>

                {/* Contact */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">📞 {patient.phone}</Typography>
                  <Typography variant="body2">✉️ {patient.email}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Visit Info */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Last Visit
                    </Typography>
                    <Typography fontWeight={500}>
                      {formatDateTime(patient.lastVisit)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Next Appointment
                    </Typography>
                    <Typography fontWeight={500}>
                      {formatDateTime(patient.nextAppointment)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Conditions */}
                {patient.conditions?.length > 0 && (
                  <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {patient.conditions.map((c, i) => (
                      <Chip
                        key={i}
                        label={c}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" fullWidth>
                    View Profile
                  </Button>
                  <Button size="small" variant="contained" fullWidth>
                    Book Appointment
                  </Button>
                </Box>

              </CardContent>
            </Card>

          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Patients;
