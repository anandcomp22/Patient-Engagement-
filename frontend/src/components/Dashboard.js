import React from "react";
import { Grid, Paper, Typography } from "@mui/material";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="content">
      {/* Top Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Typography className="box-title">Today's Appointments</Typography>
            <Typography className="box-value">1</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Typography className="box-title">Total Patients</Typography>
            <Typography className="box-value">3</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Typography className="box-title">Pending Prescriptions</Typography>
            <Typography className="box-value">2</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Typography className="box-title">Urgent Cases</Typography>
            <Typography className="box-value">1</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Appointments & AI Prescription Insights */}
      <Grid container spacing={3} className="section-container">
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            <Typography variant="h6" className="section-title">Upcoming Appointments</Typography>
            <Typography className="appointment-info">
              <strong>John Doe</strong> - Follow-up on blood pressure medication
            </Typography>
            <Typography className="appointment-time">10:00 AM | Video Call</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            <Typography variant="h6" className="section-title">AI Prescription Insights</Typography>
            <Typography className="insight-info">
              <strong>Medication Interaction Alert:</strong> Potential interaction detected between Lisinopril and patient's existing medication.
            </Typography>
            <Typography className="insight-info">
              <strong>Treatment Recommendation:</strong> Consider adding a long-acting bronchodilator.
            </Typography>
            <Typography className="insight-info">
              <strong>Follow-up Reminder:</strong> Patient John Doe is due for lab work.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
