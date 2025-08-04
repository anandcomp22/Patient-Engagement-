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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get("http://localhost:8000/patients");
        setPatients(response.data);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
socket.on("newPatient", (newPatient) => {
      setPatients((prev) => [...prev, newPatient]);
    });

    // Cleanup on unmount
    return () => {
      socket.off("newPatient");
    };
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
        {patients.map((patient, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#007BFF" }}>{patient.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">{patient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.age} years, {patient.gender}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    📞 {patient.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✉️ {patient.email}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Last Visit</Typography>
                    <Typography variant="body2" color="text.secondary">{patient.lastVisit}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">Next Appointment</Typography>
                    <Typography variant="body2" color="text.secondary">{patient.nextAppointment}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {patient.conditions.map((condition, idx) => (
                    <Chip key={idx} label={condition} color="primary" variant="outlined" />
                  ))}
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
