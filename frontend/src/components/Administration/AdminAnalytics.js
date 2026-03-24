import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import { TrendingUp, BarChartOutlined, PieChartOutlined, Timeline } from "@mui/icons-material";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PIE_COLORS = ["#667eea","#f093fb","#4facfe","#43e97b","#fa709a","#a18cd1","#f6d365","#fda085","#f5576c","#38f9d7"];

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

  useEffect(() => {
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
          <ChartCard title="Monthly Revenue (₹)" icon={TrendingUp} gradient="linear-gradient(135deg,#43e97b,#38f9d7)" loading={loading.m}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#43e97b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#43e97b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}`} />
                <Tooltip content={<CustomTooltip />} formatter={v=>[`₹${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={3} fill="url(#revArea)" dot={{ r:5, fill:"#22c55e", stroke:"#fff", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Specialty Pie Chart */}
        <Grid item xs={12} md={4}>
          <ChartCard title="Doctor Specialties" icon={PieChartOutlined} gradient="linear-gradient(135deg,#667eea,#764ba2)" loading={loading.s}>
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
          <ChartCard title="Top Doctors by Appointments" icon={BarChartOutlined} gradient="linear-gradient(135deg,#4facfe,#00f2fe)" loading={loading.d}>
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
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Daily Appointments Trend */}
        <Grid item xs={12} md={6}>
          <ChartCard title="Daily Appointments (Last 30 Days)" icon={Timeline} gradient="linear-gradient(135deg,#fa709a,#fee140)" loading={loading.da}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="dayArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fa709a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fa709a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={d => d ? d.slice(5) : ""} />
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Appointments" stroke="#fa709a" strokeWidth={3} fill="url(#dayArea)"
                  dot={{ r:3, fill:"#fa709a", stroke:"#fff", strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
