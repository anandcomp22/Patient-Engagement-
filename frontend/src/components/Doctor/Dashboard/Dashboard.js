import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
const API_BASE = process.env.REACT_APP_API_URL;

const socket = io(API_BASE);

const Dashboard = ({ sidebarOpen }) => {
  const navigate = useNavigate();
  const [medicalNews, setMedicalNews] = useState([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
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
          `${API_BASE}/doctor/app`,
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
            new Date(app.appointmentDate).toISOString().split("T")[0] === today
        ).length;

        const patientsRecovered = allAppointments.filter(
          (app) => app.appstatus?.toLowerCase() === "appointment done"
        ).length;

        const urgentCases = allAppointments.filter((app) => {
          const appDate = new Date(app.appointmentDate);
          const diff = (appDate - now) / (1000 * 60 * 60);
          return diff > 0 && diff <= 24;
        }).length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const upcoming = allAppointments.filter(app => {
          const appDate = new Date(app.appointmentDate);
          return (
            appDate >= todayStart &&
            app.appstatus?.toLowerCase() !== "cancelled"
          );
        }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

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
          `${API_BASE}/api/news/medical-news`
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

  const handleViewAll = () => {
  setShowAllAppointments(true);
};

  return (
    <Box sx={{ p: 3, mt: 3 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#1E5DA9' }}>
              {greeting}, {DoctorName || "Doctor"}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'gray' }}>
            Welcome to your Doctor's dashboard.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Appointments */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              backgroundColor: "#E3F2FD",
              borderRadius: "16px",
              p: 2,
              textAlign: "center",
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#BBDEFB",
                boxShadow: "0 6px 16px rgba(30,93,169,0.2)",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <CalendarMonth sx={{ color: "#1E88E5", fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Today's Appointments
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
              {metrics.todayAppointments}
            </Typography>
          </Paper>
        </Grid>

        {/* Patient Satisfaction */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              backgroundColor: "#E8F5E9",
              borderRadius: "16px",
              p: 2,
              textAlign: "center",
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#C8E6C9",
                boxShadow: "0 6px 16px rgba(56,142,60,0.2)",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <People sx={{ color: "#43A047", fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Patient Satisfaction
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
              {metrics.patientSatisfaction}%
            </Typography>
          </Paper>
        </Grid>

        {/* Patient Recovered */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              backgroundColor: "#FFF3E0",
              borderRadius: "16px",
              p: 2,
              textAlign: "center",
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#FFE0B2",
                boxShadow: "0 6px 16px rgba(255,152,0,0.2)",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <Description sx={{ color: "#FB8C00", fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Patient Recovered
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
              {metrics.patientsRecovered}
            </Typography>
          </Paper>
        </Grid>

        {/* Urgent Cases */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              backgroundColor: "#FCE4EC",
              borderRadius: "16px",
              p: 2,
              textAlign: "center",
              height: "100%",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#F8BBD0",
                boxShadow: "0 6px 16px rgba(233,30,99,0.2)",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                backgroundColor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <Warning sx={{ color: "#E91E63", fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Urgent Cases
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold", mt: 0.5 }}>
              {metrics.urgentCases}
            </Typography>
          </Paper>
        </Grid>
      </Grid>


      {/* Upcoming Appointments & AI Prescription Insights */}
      <Grid container spacing={3} className="section-container">
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Paper className="section-box">
            <Typography variant="h6" className="section-title">
              Upcoming Appointments
            </Typography>
            {upcomingAppointments.length === 0 ? (
              <Typography>No upcoming appointments.</Typography>
            ) : (
              (showAllAppointments
                ? upcomingAppointments
                : upcomingAppointments.slice(0, 3)
              ).map((appointment, index) => (
                <Box key={index} className="appointment-card">
                  <Avatar
                    sx={{
                      bgcolor: "#f0f2f5",
                      color: "#555",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {appointment.patientName?.toString().charAt(0) || "P"}
                  </Avatar>

                  <Box className="appointment-details">
                    <Typography className="appointment-name">
                      <strong>Patient: {appointment.patientName} - {(appointment.patientId)}</strong>
                    </Typography>
                    <Typography className="appointment-info">
                      Status: {appointment.appstatus}
                    </Typography>
                  </Box>

                  <Box className="appointment-meta">
                    <Typography className="appointment-time">
                      <AccessTime sx={{ fontSize: 16, marginRight: "5px" }} />
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={async () => {
                      await fetch(`${API_BASE}/email/send-video-link`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: appointment.patientEmail,
                          link: `${window.location.origin}/video-call/${appointment._id}`,
                          doctorName: DoctorName,
                        }),
                      });
                      alert("Email sent to patient");
                    }}
                  >
                    Send via Email
                  </Button>
                </Box>                
              ))
            )}

            {/* Toggle View All / View Less */}
            {upcomingAppointments.length > 3 && (
              <Typography
                className="view-all"
                onClick={() => setShowAllAppointments(!showAllAppointments)}
                sx={{ cursor: "pointer", color: "#1976d2", mt: 1 }}
              >
                {showAllAppointments ? "View less" : "View all appointments"}
              </Typography>
            )}
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
   </Box>
  );
};

export default Dashboard;
