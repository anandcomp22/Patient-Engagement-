import React from "react";
import { Grid, Paper, Typography, Box, Avatar  } from "@mui/material";
import { CalendarMonth, People, Description, Warning, AccessTime} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

import "./Dashboard.css";

const Dashboard = () => {
  const [medicalNews, setMedicalNews] = useState([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const insightColors = ["#E3EAFD", "#E8F5E9", "#FFF3E0", "#FCE4EC", "#F3E5F5"];
  const decodeHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  };
  
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/news/medical-news");
        setMedicalNews(res.data);
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };
  
    fetchNews();

    const interval = setInterval(fetchNews, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleInsights = () => {
    setShowAllInsights(!showAllInsights);
  };

  return (
    <div className="content">
      <Typography variant="h5" sx={{ color: '#1E5DA9', mb: 4 }}>
              Doctor Dashboard
            </Typography>
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

        {/* AI medical field Insights */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
          {/* Title with Separator */}
            <Typography variant="h6" className="section-title">
              Medical Field Insights
            </Typography>  

          {/* Insights Cards */}
          {medicalNews.length === 0 ? (
              <Box className="insight-card" style={{ backgroundColor: "#F0F4F8" }}>
                <Typography className="insight-text">Loading real-time medical insights...</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  maxHeight: showAllInsights ? "400px" : "240px",
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
              >
                {(showAllInsights ? medicalNews : medicalNews.slice(0, 4)).map((news, index) => (
                  <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                    <Box
                      className="insight-card"
                      style={{
                        backgroundColor: insightColors[index % insightColors.length],
                        marginBottom: "10px",
                      }}
                    >
                      <Typography className="insight-title" sx={{ fontWeight: "bold" }}>
                        {decodeHtml(news.title)}
                      </Typography>
                      <Typography className="insight-text">{decodeHtml(news.description)}</Typography>
                      <Typography
                        className="insight-meta"
                        style={{ fontSize: "12px", marginTop: "4px", color: "#777" }}
                      >
                        {new Date(news.published_at).toLocaleString()} | Source: {news.source}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}


            {/* View All AI Insights */}
            <Typography
              className="view-all"
              onClick={handleToggleInsights}
              style={{ cursor: "pointer", marginTop: "10px", color: "#1E5DA9" }}
            >
              {showAllInsights ? "Show less AI insights" : "View all AI insights"}
            </Typography>

          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
