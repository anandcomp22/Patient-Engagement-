import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box, Typography, Grid, Paper
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

import { API_BASE } from "../../apiConfig";

const API = API_BASE;

const AdminAnalytics = () => {
  const [monthly, setMonthly] = useState([]);
  const [doctorWise, setDoctorWise] = useState([]);

  const auth = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  useEffect(() => {
    axios.get(`${API}/admin/analytics/monthly-revenue`, auth)
      .then(res => setMonthly(
        res.data.map(d => ({
          month: `M${d._id}`,
          revenue: d.total
        }))
      ));

    axios.get(`${API}/admin/analytics/doctor-wise`, auth)
      .then(res => setDoctorWise(res.data));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={3}>Analytics</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight="bold">Monthly Revenue</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="revenue" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight="bold">Doctor-wise Appointments</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={doctorWise}>
                <XAxis dataKey="doctorName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
