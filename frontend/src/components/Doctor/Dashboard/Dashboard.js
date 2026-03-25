import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Avatar,
  Alert,
  Chip,
  Tooltip,
  IconButton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  CalendarMonth,
  People,
  Description,
  Warning,
  AccessTime,
  MailOutline,
  Videocam
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import io from "socket.io-client";
import "./Dashboard.css";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const socket = io(API_BASE);

const Dashboard = ({ sidebarOpen }) => {
  const navigate = useNavigate();
  const [medicalNews, setMedicalNews] = useState([]);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [doctor, setDoctor] = useState(null);
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
          `${API_BASE}/appointment/app`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ); 
        const allAppointments = res.data;

        const isToday = (date) => {
        const d = new Date(date);
        const now = new Date();
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      };

      const now = new Date();

      const todayAppointments = allAppointments.filter(app => {
        const d = new Date(app.appointmentDate);
        return (
          isToday(d) &&
          d > now &&
          app.appstatus?.toLowerCase() !== "cancelled"
        );
      }).length;


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
    const fetchDoctorProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_BASE}/doctor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setDoctor(res.data);
      } catch (err) {
        console.error("Failed to fetch doctor profile", err);
      }
    };

    fetchDoctorProfile();
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

  if (doctor && doctor.verificationStatus === "pending") {
    return (
      <Box sx={{ p: 3, mt: 3 }}>
        <Alert severity="warning">
          Your license is under verification by admin.
        </Alert>
      </Box>
    );
  }

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
        <Grid item xs={12} md={6} mt={6}>
          <Paper sx={{
            p: { xs: 2.5, md: 3 }, borderRadius: "16px", background: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%",
            display: "flex", flexDirection: "column"
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1E5DA9" }}>
                Upcoming Appointments
              </Typography>
              <Chip label={upcomingAppointments.length} size="small" sx={{ background: "#E3F2FD", color: "#1E5DA9", fontWeight: 700 }} />
            </Box>

            {upcomingAppointments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", background: "#f8fafc", borderRadius: 3 }}>
                <Typography sx={{ color: "#777" }}>No upcoming appointments today.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                {(showAllAppointments
                  ? upcomingAppointments
                  : upcomingAppointments.slice(0, 3)
                ).map((appointment, index) => (
                  <Box key={index} sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    p: 2, borderRadius: 3, background: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    "&:hover": { background: "#fff", boxShadow: "0 4px 12px rgba(30,93,169,0.08)", borderColor: "rgba(30,93,169,0.2)" }
                  }}>
                    {/* Patient Info */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)", color: "#fff", width: 44, height: 44, fontWeight: 700 }}>
                        {appointment.patientName?.toString().charAt(0) || "P"}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: "#333", fontSize: "0.95rem" }}>
                          {appointment.patientName}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          <Chip size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, background: "#E8F5E9", color: "#2e7d32" }} 
                                label={appointment.appstatus || "Scheduled"} />
                          <Typography sx={{ fontSize: "0.75rem", color: "#777" }}>
                            ID: {appointment.patientId?.toString().slice(-6) || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions & Time */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.5 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#1E5DA9", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 16 }} />
                        {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Email Join Link to Patient">
                          <IconButton size="small"
                            sx={{ color: "#60a5fa", background: "rgba(96,165,250,0.1)", "&:hover": { background: "rgba(96,165,250,0.2)" } }}
                            onClick={async () => {
                              try {
                                const payload = { email: appointment.patientEmail, link: `${window.location.origin}/patient/video-call?roomId=${appointment._id}`, doctorName: DoctorName };
                                await axios.post(`${API_BASE}/email/send-video-link`, payload);
                                alert("Video link sent to patient's email!");
                              } catch(e) { console.error("Could not send email", e); }
                            }}
                          >
                            <MailOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button variant="contained" size="small" startIcon={<Videocam/>}
                          sx={{ background: "#1E5DA9", color: "#fff", textTransform: "none", borderRadius: 2, px: 2, boxShadow: "none", "&:hover": { background: "#0f3f7a", boxShadow: "0 4px 10px rgba(30,93,169,0.2)" } }}
                          onClick={() => navigate(`/doctor/video-call?roomId=${appointment._id}&patientEmail=${appointment.patientEmail}`)}
                        >
                          Join
                        </Button>
                      </Box>
                    </Box>
                  </Box>                
                ))}
              </Box>
            )}

            {/* Toggle View All */}
            {upcomingAppointments.length > 3 && (
              <Button fullWidth variant="text" onClick={() => setShowAllAppointments(p => !p)}
                sx={{ mt: 2, color: "#1E5DA9", textTransform: "none", fontWeight: 600 }}
              >
                {showAllAppointments ? "View Less" : `View All (${upcomingAppointments.length})`}
              </Button>
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
