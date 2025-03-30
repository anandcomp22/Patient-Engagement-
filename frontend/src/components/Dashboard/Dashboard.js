import React from "react";
import { Grid, Paper, Typography, Box, Avatar  } from "@mui/material";
import { CalendarMonth, People, Description, Warning, AccessTime} from "@mui/icons-material";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="content">
      {/* Top Metrics */}
      <Grid container spacing={3}>
        {/* Today's Appointments */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box" >
            <Box className="icon-container" sx={{ backgroundColor: "#DDE8FF" }}>
              <CalendarMonth sx={{ color: "#3F72FF" }} />
            </Box>
            <Typography className="box-title">Today's Appointments</Typography>
            <div className="box-value">1</div>
          </Paper>
        </Grid>

        {/* Total Patients */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#DFFFE0" }}>
              <People sx={{ color: "#3DDC84" }} />
            </Box>
            <Typography className="box-title">Total Patients</Typography>
            <div className="box-value">3</div>
          </Paper>
        </Grid>

        {/* Pending Prescriptions */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#F4E0FF" }}>
              <Description sx={{ color: "#A04DFF" }} />
            </Box>
            <Typography className="box-title">Pending Prescriptions</Typography>
            <div className="box-value">2</div>
          </Paper>
        </Grid>

        {/* Urgent Cases */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#FFF6D9" }}>
              <Warning sx={{ color: "#FFC107" }} />
            </Box>
            <Typography className="box-title">Urgent Cases</Typography>
            <div className="box-value">1</div>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Appointments & AI Prescription Insights */}
      <Grid container spacing={3} className="section-container">
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            <Typography variant="h6" className="section-title">Upcoming Appointments</Typography>

            {/* Appointment Card */}
            <Box className="appointment-card">
              {/* Avatar */}
              <Avatar sx={{ bgcolor: "#f0f2f5", color: "#555", width: 40, height: 40 }}>S</Avatar>

              {/* Appointment Details */}
              <Box className="appointment-details">
                <Typography className="appointment-name"><strong>Sayyoni Parate</strong></Typography>
                <Typography className="appointment-info">Follow-up on blood pressure medication</Typography>
              </Box>

              {/* Time & Video Button */}
              <Box className="appointment-meta">
                <Typography className="appointment-time">
                  <AccessTime sx={{ fontSize: 16, marginRight: "5px" }} />
                  10:00 AM
                </Typography>
              </Box>
            </Box>

            {/* View All Appointments */}
            <Typography className="view-all">
              View all appointments
            </Typography>
          </Paper>
        </Grid>

        {/* AI Prescription Insights */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
          {/* Title with Separator */}
            <Typography variant="h6" className="section-title">
              AI Prescription Insights
            </Typography>
              

          {/* Insights Cards */}
          <Box className="insight-card" style={{ backgroundColor: "#E3EAFD" }}>
            <Typography className="insight-title">Medication Interaction Alert</Typography>
            <Typography className="insight-text">
              Potential interaction detected between Lisinopril and patient's existing medication. Consider alternative ACE inhibitor or adjusting dosage.
            </Typography>
          </Box>

          <Box className="insight-card" style={{ backgroundColor: "#E8F5E9" }}>
          <Typography className="insight-title">Treatment Recommendation</Typography>
          <Typography className="insight-text">
             Based on patient's history of asthma, consider adding a long-acting bronchodilator to current treatment plan.
          </Typography>
         </Box>

        <Box className="insight-card" style={{ backgroundColor: "#FFF3E0" }}>
          <Typography className="insight-title">Follow-up Reminder</Typography>
          <Typography className="insight-text">
            Patient Sayyoni Parate is due for follow-up lab work to monitor kidney function with current medication regimen.
          </Typography>
        </Box>

            {/* View All AI Insights */}
            <Typography className="view-all">
              View all AI insights
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
