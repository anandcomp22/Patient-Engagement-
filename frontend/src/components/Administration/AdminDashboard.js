import React, { useEffect, useState } from "react";
import {
  Box, Grid, Paper, Typography, Avatar, Chip, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Skeleton
} from "@mui/material";
import {
  People, LocalHospital, EventAvailable, CurrencyRupee,
  Warning, Videocam, TrendingUp, CheckCircle
} from "@mui/icons-material";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const GRADIENT_CARDS = [
  { key: "doctors",       label: "Total Doctors",    icon: LocalHospital,    grad: "linear-gradient(135deg, #1E3A8A, #3B82F6)", link: "/admin/doctors" },
  { key: "patients",      label: "Total Patients",   icon: People,           grad: "linear-gradient(135deg, #0F766E, #14B8A6)", link: "/admin/patients" },
  { key: "appointments",  label: "Appointments",     icon: EventAvailable,   grad: "linear-gradient(135deg, #4338CA, #6366F1)", link: null },
  { key: "revenue",       label: "Revenue (₹)",      icon: CurrencyRupee,    grad: "linear-gradient(135deg, #065F46, #10B981)", link: null },
  { key: "pendingDoctors",label: "Pending Verify",   icon: Warning,          grad: "linear-gradient(135deg, #B45309, #F59E0B)", link: "/admin/verify" },
  { key: "activeCalls",   label: "Active Calls",     icon: Videocam,         grad: "linear-gradient(135deg, #5B21B6, #8B5CF6)", link: null },
];

const STATUS_COLOR = { confirmed:"#3B82F6", pending:"#F59E0B", cancelled:"#EF4444", completed:"#10B981" };

const AdminDashboard = () => {
  const [metrics, setMetrics]         = useState({});
  const [recentApp, setRecentApp]     = useState([]);
  const [monthly, setMonthly]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const navigate = useNavigate();

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const load = async () => {
    try {
      const [m, r, rev] = await Promise.all([
        axios.get(`${API}/admin/dashboard/metrics`, auth),
        axios.get(`${API}/admin/dashboard/recent-appointments`, auth),
        axios.get(`${API}/admin/analytics/monthly-revenue`, auth),
      ]);
      setMetrics(m.data);
      setRecentApp(r.data || []);
      setMonthly(rev.data || []);
    } catch (e) { console.error(e); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Real-time: auto-refresh dashboard on any change
  useEffect(() => {
    const socket = io(API);
    socket.on("appointment-updated", () => load());
    socket.on("payment-updated", () => load());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#f0f4f8", p:3 }}>

      {/* Header */}
      <Box sx={{ mb:4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e", letterSpacing:-0.5 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Here's what's happening today.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2} mb={4} alignItems="stretch">
        {GRADIENT_CARDS.map(({ key, label, icon: Icon, grad, link }) => (
          <Grid item xs={6} sm={4} md={2} key={key} sx={{ display:"flex" }}>
            <Paper
              onClick={() => link && navigate(link)}
              sx={{
                background: grad,
                borderRadius:"20px",
                p:2.5,
                color:"#fff",
                cursor: link ? "pointer" : "default",
                transition:"all 0.3s",
                boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
                width:"100%",
                display:"flex",
                flexDirection:"column",
                justifyContent:"space-between",
                minHeight:130,
                "&:hover": link ? { transform:"translateY(-6px)", boxShadow:"0 16px 40px rgba(0,0,0,0.18)" } : {}
              }}
            >
              {/* Top row: label + icon */}
              <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <Typography
                  variant="body2"
                  sx={{ opacity:0.9, fontWeight:600, lineHeight:1.3, maxWidth:"calc(100% - 56px)" }}
                >
                  {label}
                </Typography>
                <Avatar sx={{ bgcolor:"rgba(255,255,255,0.25)", width:40, height:40, flexShrink:0 }}>
                  <Icon sx={{ color:"#fff", fontSize:20 }} />
                </Avatar>
              </Box>

              {/* Value */}
              <Box>
                {loading
                  ? <Skeleton variant="text" width={60} height={44} sx={{ bgcolor:"rgba(255,255,255,0.3)" }} />
                  : <Typography variant="h4" fontWeight={800} sx={{ lineHeight:1.1, my:0.5 }}>
                      {key==="revenue" ? `₹${(metrics[key]||0).toLocaleString()}` : (metrics[key]||0)}
                    </Typography>
                }

                {/* Live data badge */}
                {!loading && (
                  <Box sx={{ opacity:0.8, display:"flex", alignItems:"center", gap:0.5, mt:0.5 }}>
                    <TrendingUp sx={{ fontSize:14 }} />
                    <Typography variant="caption" sx={{ fontSize:"0.68rem" }}>Live data</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>


      {/* Revenue chart + Quick actions */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius:"20px", p:3, boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
            <Typography fontWeight={700} mb={2} sx={{ color:"#1a1a2e" }}>Monthly Revenue Trend</Typography>
            {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius:2 }} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly}>
                  <XAxis dataKey="month" tick={{ fontSize:12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [`₹${v}`, "Revenue"]} />
                  <Line
                    type="monotone" dataKey="revenue" strokeWidth={3}
                    stroke="url(#revGrad)" dot={{ r:5, fill:"#1E3A8A" }}
                  />
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1E3A8A" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ borderRadius:"20px", p:3, boxShadow:"0 4px 20px rgba(0,0,0,0.06)", height:"100%" }}>
            <Typography fontWeight={700} mb={2} sx={{ color:"#1a1a2e" }}>Quick Actions</Typography>
            {[
              { label:"Verify Doctors",   color:"#1E3A8A", path:"/admin/verify"    },
              { label:"View Doctors",     color:"#0F766E", path:"/admin/doctors"   },
              { label:"Manage Patients",  color:"#4338CA", path:"/admin/patients"  },
              { label:"View Analytics",   color:"#065F46", path:"/admin/analytics" },
              { label:"Activity Logs",    color:"#B45309", path:"/admin/logs"      },
              { label:"Payments",         color:"#5B21B6", path:"/admin/payments"  },
            ].map(btn => (
              <Button
                key={btn.label} fullWidth variant="outlined"
                onClick={() => navigate(btn.path)}
                sx={{
                  mb:1, borderRadius:"12px", borderColor:btn.color, color:btn.color,
                  fontWeight:600, textTransform:"none",
                  "&:hover": { bgcolor:btn.color, color:"#fff", borderColor:btn.color }
                }}
              >{btn.label}</Button>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Appointments */}
      <Paper sx={{ borderRadius:"20px", p:3, boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
        <Typography fontWeight={700} mb={2} sx={{ color:"#1a1a2e" }}>Recent Appointments</Typography>
        {loading ? <CircularProgress /> : (
          <Box sx={{ overflowX:"auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight:700, color:"#64748b", border:"none", pb:1 } }}>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentApp.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color:"#94a3b8", py:4 }}>No appointments yet</TableCell></TableRow>
                )}
                {recentApp.map(a => (
                  <TableRow key={a._id} sx={{ "&:hover":{ bgcolor:"#f8fafc" }, "& td":{ border:"none", py:1.5 } }}>
                    <TableCell sx={{ fontWeight:600 }}>{a.patientName}</TableCell>
                    <TableCell>{a.doctorName}</TableCell>
                    <TableCell>{a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Chip label={a.type||"N/A"} size="small"
                        sx={{ bgcolor:"#f1f5f9", color:"#475569", fontSize:"0.7rem", height:22, fontWeight:600, textTransform:"capitalize" }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.appstatus}
                        size="small"
                        icon={a.appstatus==="completed" ? <CheckCircle sx={{ fontSize:"14px!important" }} /> : undefined}
                        sx={{
                          bgcolor:`${STATUS_COLOR[a.appstatus]||"#94a3b8"}22`,
                          color: STATUS_COLOR[a.appstatus]||"#94a3b8",
                          fontWeight:700, fontSize:"0.7rem", height:22, textTransform:"capitalize"
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.paymentstatus}
                        size="small"
                        sx={{
                          bgcolor: a.paymentstatus==="paid" ? "#43e97b22" : "#fa709a22",
                          color: a.paymentstatus==="paid" ? "#22c55e" : "#f5576c",
                          fontWeight:700, fontSize:"0.7rem", height:22, textTransform:"capitalize"
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
