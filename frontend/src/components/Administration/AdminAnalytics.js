import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { TrendingUp, BarChartOutlined, PieChartOutlined, Timeline } from "@mui/icons-material";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PIE_COLORS = ["#1E3A8A","#0F766E","#4338CA","#065F46","#B45309","#5B21B6","#991B1B","#0369A1","#7C3AED","#047857"];

const ChartCard = ({ title, icon: Icon, gradient, children, loading }) => (
  <Paper sx={{
    borderRadius:"20px", p:3,
    boxShadow:"0 4px 24px rgba(0,0,0,0.07)",
    height:"100%"
  }}>
    <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
      <Box sx={{ width:36, height:36, borderRadius:"10px", background:gradient, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon sx={{ color:"#fff", fontSize:20 }} />
      </Box>
      <Typography fontWeight={700} sx={{ color:"#1a1a2e" }}>{title}</Typography>
    </Box>
    {loading ? (
      <Box sx={{ display:"flex", justifyContent:"center", alignItems:"center", height:260 }}>
        <CircularProgress size={32} />
      </Box>
    ) : children}
  </Paper>
);

const AdminAnalytics = () => {
  const [monthly,   setMonthly]   = useState([]);
  const [doctorWise,setDoctorWise]= useState([]);
  const [specialty, setSpecialty] = useState([]);
  const [daily,     setDaily]     = useState([]);
  const [loading,   setLoading]   = useState({ m:true, d:true, s:true, da:true });

  const auth = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchAll = () => {
    axios.get(`${API}/admin/analytics/monthly-revenue`, auth)
      .then(r => { setMonthly(r.data); setLoading(p=>({...p,m:false})); })
      .catch(() => setLoading(p=>({...p,m:false})));

    axios.get(`${API}/admin/analytics/doctor-wise`, auth)
      .then(r => { setDoctorWise(r.data); setLoading(p=>({...p,d:false})); })
      .catch(() => setLoading(p=>({...p,d:false})));

    axios.get(`${API}/admin/analytics/specialty-breakdown`, auth)
      .then(r => { setSpecialty(r.data); setLoading(p=>({...p,s:false})); })
      .catch(() => setLoading(p=>({...p,s:false})));

    axios.get(`${API}/admin/analytics/daily-appointments`, auth)
      .then(r => { setDaily(r.data); setLoading(p=>({...p,da:false})); })
      .catch(() => setLoading(p=>({...p,da:false})));
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  // Real-time: auto-refresh when payments or appointments change
  useEffect(() => {
    const socket = io(API);
    socket.on("payment-updated", () => fetchAll());
    socket.on("appointment-updated", () => fetchAll());
    return () => socket.disconnect();
  }, []); // eslint-disable-line

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <Paper sx={{ p:1.5, borderRadius:"10px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)", border:"none" }}>
        <Typography fontSize={12} fontWeight={700} color="#1a1a2e">{label}</Typography>
        {payload.map((p,i) => (
          <Typography key={i} fontSize={12} color={p.color}>{p.name}: <b>{p.value}</b></Typography>
        ))}
      </Paper>
    );
    return null;
  };

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      <Box sx={{ mb:4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color:"#1a1a2e" }}>Analytics</Typography>
        <Typography variant="body2" color="text.secondary">Platform insights and performance metrics</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Monthly Revenue Line Chart */}
        <Grid item xs={12} md={8}>
          <ChartCard title="Monthly Revenue (₹)" icon={TrendingUp} gradient="linear-gradient(135deg, #065F46, #10B981)" loading={loading.m}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} />
                <Tooltip content={<CustomTooltip />} formatter={v=>[`₹${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={3} fill="url(#revArea)" dot={{ r:5, fill:"#059669", stroke:"#fff", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Specialty Pie Chart */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Doctor Specialties" icon={PieChartOutlined} gradient="linear-gradient(135deg, #1E3A8A, #3B82F6)" loading={loading.s}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={specialty} dataKey="count" nameKey="specialty" cx="50%" cy="50%" outerRadius={90}
                  label={({ specialty:s, percent }) => `${s?.slice(0,8)} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {specialty.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Doctor-wise Appointments Bar Chart */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Top Doctors by Appointments" icon={BarChartOutlined} gradient="linear-gradient(135deg, #4338CA, #6366F1)" loading={loading.d}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={doctorWise} layout="vertical" margin={{ left:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="doctorName" tick={{ fontSize:11 }} axisLine={false} tickLine={false} width={100}
                  tickFormatter={v => v?.length>12 ? v.slice(0,12)+"…" : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Appointments" radius={[0,6,6,0]} fill="url(#barGrad)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4338CA" />
                      <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Daily Appointments Trend */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Daily Appointments (Last 30 Days)" icon={Timeline} gradient="linear-gradient(135deg, #B45309, #F59E0B)" loading={loading.da}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="dayArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={d => d ? d.slice(5) : ""} />
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Appointments" stroke="#D97706" strokeWidth={3} fill="url(#dayArea)"
                  dot={{ r:3, fill:"#D97706", stroke:"#fff", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
