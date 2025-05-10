import React, { useState, useEffect} from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { motion } from "framer-motion";
import { MenuItem, Select, FormControl, InputLabel, Box } from "@mui/material";
import "./Analysis.css";

const patientData = [
    { date: "2025-04-01", count: 10 },
    { date: "2025-04-02", count: 15 },
    { date: "2025-04-03", count: 8 },
  ];
  const avgTimeData = [
    { date: "2025-04-01", time: 30 },
    { date: "2025-04-02", time: 25 },
    { date: "2025-04-03", time: 35 },
  ];
  
  const incomeData = [
    { date: "2025-04-01", income: 500 },
    { date: "2025-04-02", income: 650 },
    { date: "2025-04-03", income: 400 },
  ];
  

export default function DoctorIncomeAnalysis() {
  const [dateRange, setDateRange] = useState("Last 6 Months");
  const [appointmentTrend, setAppointmentTrend] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);

  useEffect(() => {
    const fetchTrends = async () => {
      const daily = await fetch("http://localhost:8000/api/analytics/appointments/daily").then(res => res.json());
      const meds = await fetch("http://localhost:8000/api/analytics/medicines/top").then(res => res.json());
  
      setAppointmentTrend(daily.map(d => ({ date: d._id, count: d.count })));
      setTopMedicines(meds);
    };
    fetchTrends();
  }, []);
  

  return (
    <motion.div
      className="analysis-bg" 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      style={{
        paddingTop: "64px",
        paddingLeft: "24px",
        paddingRight: "24px",
        minHeight: "100vh",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <h1 className="text-xl font-bold mb-10 text-center text-blue-700">
        Doctor Income Dashboard
      </h1>

      {/* Filters */}
      <Box display="flex" gap={4} justifyContent="right" mb={6}>
        <FormControl variant="outlined" size="median">
          <InputLabel>Date Range</InputLabel>
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} label="Date Range">
            <MenuItem value="Last 6 Months">Last 6 Months</MenuItem>
            <MenuItem value="Last Year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Daily Appointments Trend */}
      <motion.div className="card-style">
        <h2 className="chart-title">📅 Daily Appointments</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={appointmentTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Medicines */}
      <motion.div className="card-style">
        <h2 className="chart-title">💊 Top Prescribed Medicines</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topMedicines}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-10 mb-10">
        {/* Patient Count */}
        <motion.div
            className="card-style"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
        >
            <h2 className="chart-title ">👥 Patient Count (Monthly)</h2>
            <ResponsiveContainer width="100%" height={250}>
            <BarChart data={patientData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </motion.div>

        {/* Avg Time */}
        <motion.div
            className="card-style"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
        >
            <h2 className="chart-title">⏱️ Avg. Patient Time (Minutes)</h2>
            <ResponsiveContainer width="100%" height={250}>
            <LineChart data={avgTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                type="monotone"
                dataKey="time"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 8 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </motion.div>
        </div>

        {/* Income Card Below Grid */}
        <motion.div
        className="card-style mt-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1 }}
        >
        <h2 className="chart-title">💰 Monthly Income Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={incomeData}>
            <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
                type="monotone"
                dataKey="income"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorIncome)"
            />
            </AreaChart>
        </ResponsiveContainer>
        </motion.div>
    </motion.div>
  );
}
