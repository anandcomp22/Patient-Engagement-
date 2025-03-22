import React from "react";
import { Box, Grid, Typography, Card, CardContent, Avatar, TextField, Button, Chip, Divider } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";

// Sample Patient Data
const patients = [
  {
    name: "Shreyas Sadavarte ",
    age: 19,
    gender: "Male",
    phone: "(555) 123-4567",
    email: "shreyas@example.com",
    lastVisit: "May 15, 2025",
    nextAppointment: "June 10, 2025",
    conditions: ["Hypertension", "Type 2 Diabetes"],
  },
  {
    name: "Saayoni Parate",
    age: 21,
    gender: "Female",
    phone: "(555) 987-6543",
    email: "sayyoni@example.com",
    lastVisit: "April 22, 2025",
    nextAppointment: "July 5, 2025",
    conditions: ["Chronic Migraines", "Anxiety"],
  },
  {
    name: "Prathmesh Vharkal",
    age: 17,
    gender: "Male",
    phone: "(555) 456-7890",
    email: "prathmesh@example.com",
    lastVisit: "May 3, 2025",
    nextAppointment: "June 15, 2025",
    conditions: ["Type 2 Diabetes", "Hyperlipidemia", "Osteoarthritis"],
  },
  {
    name: "Radhha reddy",
    age: 29,
    gender: "Female",
    phone: "(555) 234-5678",
    email: "radhha@example.com",
    lastVisit: "May 18, 2025",
    nextAppointment: "May 25, 2025",
    conditions: ["Severe Allergies", "Asthma"],
  },
];

const Patients = () => {
  return (
    <Box sx={{ padding: 3, mt: 5}}>
      {/* Search Bar, Filter & Add Patient Section */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, gap:2 }}>
        {/* Header Section */}
          <h2 fontWeight="bold">Patients</h2>
        {/* Search Bar on Left */}
        <Box sx={{display: "flex", gap:2}}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search patients..."
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
            sx={{ width: 200 }}
          />

          {/* Buttons on Right */}
        
            <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: "none" }}>
              Filter
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
              Add Patient
            </Button>
        </Box>
      </Box>

      {/* Patients Grid */}
      <Grid container spacing={3}>
        {patients.map((patient, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ padding: 2, borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                {/* Avatar and Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#007BFF" }}>{patient.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">{patient.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient.age} years, {patient.gender}
                    </Typography>
                  </Box>
                </Box>

                {/* Contact Info */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    📞 {patient.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ✉️ {patient.email}
                  </Typography>
                </Box>

                {/* Divider Line Between Email & Last Visit */}
                <Divider sx={{ my: 2 }} />

                {/* Visit & Appointment Info (Aligned) */}
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

                {/* Conditions (Chips) */}
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
