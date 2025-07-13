import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import {
  CalendarMonth,
  People,
  Description,
  Warning,
  AccessTime,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import io from "socket.io-client";
import "./Dashboard.css";

const socket = io("http://localhost:8000");

const Dashboard = ({ sidebarOpen }) => {
  const [medicalNews, setMedicalNews] = useState([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [DoctorName, setDoctorName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const insightColors = [
    "#E3EAFD",
    "#E8F5E9",
    "#FFF3E0",
    "#FCE4EC",
    "#F3E5F5",
  ];

  useEffect(() => {
    const name = localStorage.getItem("doctorName");
    setDoctorName(name || "");

    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 14) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const decodeHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  };

  const [metrics, setMetrics] = useState({
    todayAppointments: 0,
    patientSatisfaction: 90,
    patientsRecovered: 0,
    urgentCases: 0,
  });

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:8000/doctor/appointment",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const allAppointments = res.data;

        const today = new Date().toISOString().split("T")[0];
        const now = new Date();

        const todayAppointments = allAppointments.filter(
          (app) =>
            new Date(app.date).toISOString().split("T")[0] === today
        ).length;

        const patientsRecovered = allAppointments.filter(
          (app) => app.appstatus === "Appointment Done"
        ).length;

        const urgentCases = allAppointments.filter((app) => {
          const appDate = new Date(app.date);
          const diff = (appDate - now) / (1000 * 60 * 60);
          return diff > 0 && diff <= 24;
        }).length;

        const upcoming = allAppointments
          .filter(
            (app) =>
              new Date(app.date) > now && app.appstatus === "confirmed"
          )
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3); // Limit to top 3

        setMetrics({
          todayAppointments,
          patientSatisfaction: 92,
          patientsRecovered,
          urgentCases,
        });

        setUpcomingAppointments(upcoming);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
        }
      }
    };

    fetchDashboardMetrics();
    socket.on("appointment-updated", fetchDashboardMetrics);
    return () => socket.off("appointment-updated");
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/news/medical-news"
        );
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
    <div
      className="content"
      style={{
        marginLeft: sidebarOpen ? 0 : 0,
        transition: "margin-left 0.3s ease-in-out",
      }}
    >
      <Typography variant="h5" sx={{ color: "#1E5DA9", mb: 4 }}>
        {greeting}, {DoctorName || "Doctor"}!
      </Typography>

      {/* Top Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#DDE8FF" }}>
              <CalendarMonth sx={{ color: "#3F72FF" }} />
            </Box>
            <Typography className="box-title">Today's Appointments</Typography>
            <div className="box-value">{metrics.todayAppointments}</div>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#DFFFE0" }}>
              <People sx={{ color: "#3DDC84" }} />
            </Box>
            <Typography className="box-title">Patient Satisfaction</Typography>
            <div className="box-value">{metrics.patientSatisfaction}%</div>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#F4E0FF" }}>
              <Description sx={{ color: "#A04DFF" }} />
            </Box>
            <Typography className="box-title">Patient Recovered</Typography>
            <div className="box-value">{metrics.patientsRecovered}</div>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper className="dashboard-box">
            <Box className="icon-container" sx={{ backgroundColor: "#FFF6D9" }}>
              <Warning sx={{ color: "#FFC107" }} />
            </Box>
            <Typography className="box-title">Urgent Cases</Typography>
            <div className="box-value">{metrics.urgentCases}</div>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Appointments & AI Prescription Insights */}
      <Grid container spacing={3} className="section-container">
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            {upcomingAppointments.length === 0 ? (
              <Typography>No upcoming appointments.</Typography>
            ) : (
              upcomingAppointments.map((appointment, index) => (
                <Box key={index} className="appointment-card">
                  <Avatar
                    sx={{
                      bgcolor: "#f0f2f5",
                      color: "#555",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {appointment.patientId?.toString().charAt(0) || "P"}
                  </Avatar>

                  <Box className="appointment-details">
                    <Typography className="appointment-name">
                      <strong>Patient ID: {appointment.patientId}</strong>
                    </Typography>
                    <Typography className="appointment-info">
                      Status: {appointment.appstatus}
                    </Typography>
                  </Box>

                  <Box className="appointment-meta">
                    <Typography className="appointment-time">
                      <AccessTime
                        sx={{ fontSize: 16, marginRight: "5px" }}
                      />
                      {new Date(appointment.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
            <Typography className="view-all">View all appointments</Typography>
          </Paper>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            <Typography variant="h6" className="section-title">
              Medical Field Insights
            </Typography>

            {medicalNews.length === 0 ? (
              <Box
                className="insight-card"
                style={{ backgroundColor: "#F0F4F8" }}
              >
                <Typography className="insight-text">
                  Loading real-time medical insights...
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  maxHeight: showAllInsights ? "400px" : "240px",
                  overflowY: "auto",
                  paddingRight: "8px",
                }}
              >
                {(showAllInsights
                  ? medicalNews
                  : medicalNews.slice(0, 4)
                ).map((news, index) => (
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
                        backgroundColor:
                          insightColors[index % insightColors.length],
                        marginBottom: "10px",
                      }}
                    >
                      <Typography
                        className="insight-title"
                        sx={{ fontWeight: "bold" }}
                      >
                        {decodeHtml(news.title)}
                      </Typography>
                      <Typography className="insight-text">
                        {decodeHtml(news.description)}
                      </Typography>
                      <Typography
                        className="insight-meta"
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          color: "#777",
                        }}
                      >
                        {new Date(news.published_at).toLocaleString()} | Source:{" "}
                        {news.source}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            )}

            <Typography
              className="view-all"
              onClick={handleToggleInsights}
              style={{
                cursor: "pointer",
                marginTop: "10px",
                color: "#1E5DA9",
              }}
            >
              {showAllInsights
                ? "Show less AI insights"
                : "View all AI insights"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
