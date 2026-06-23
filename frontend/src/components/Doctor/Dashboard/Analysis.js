import React, { useState, useEffect, useRef } from "react";
import "./Analysis.css";
import Chart from "chart.js/auto";
import { CircularProgress, Alert } from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Analysis = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);

  const appointmentsRef = useRef(null);
  const patientsRef = useRef(null);
  const avgTimeRef = useRef(null);
  const incomeRef = useRef(null);

  const chartInstances = useRef([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Doctor token not found. Please log in.");
        setLoading(false);
        return;
      }

      // Only send date params when they actually have values
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get(`${API_BASE}/api/analytics/doctor-overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setAnalyticsData(res.data);
    } catch (err) {
      console.error("Error fetching doctor analytics:", err);
      // Show detailed error from server for debugging
      const serverMsg = err.response?.data?.error
        || err.response?.data?.message
        || err.response?.data?.details
        || err.message
        || "Failed to load real-time analytics data.";
      setError(`Analytics error: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Re-render charts when analyticsData changes
  useEffect(() => {
    if (analyticsData) {
      destroyCharts();
      renderCharts(analyticsData);
    }
    return () => destroyCharts();
  }, [analyticsData]);

  const destroyCharts = () => {
    chartInstances.current.forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = [];
  };

  const renderCharts = (data) => {
    const { dates, appointments, patients, avgTime, income } = data;

    if (appointmentsRef.current) {
      chartInstances.current.push(
        new Chart(appointmentsRef.current, {
          type: "bar",
          data: {
            labels: dates,
            datasets: [{
              label: "Appointments",
              data: appointments,
              backgroundColor: "#5aa9ff",
              borderRadius: 8
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        })
      );
    }

    if (patientsRef.current) {
      chartInstances.current.push(
        new Chart(patientsRef.current, {
          type: "bar",
          data: {
            labels: dates,
            datasets: [{
              label: "Patients Count",
              data: patients,
              backgroundColor: "#3b82f6",
              borderRadius: 8
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        })
      );
    }

    if (avgTimeRef.current) {
      chartInstances.current.push(
        new Chart(avgTimeRef.current, {
          type: "line",
          data: {
            labels: dates,
            datasets: [{
              label: "Avg Time (mins)",
              data: avgTime,
              borderColor: "#2563eb",
              tension: 0.4,
              pointRadius: 4,
              fill: false
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        })
      );
    }

    if (incomeRef.current) {
      chartInstances.current.push(
        new Chart(incomeRef.current, {
          type: "line",
          data: {
            labels: dates,
            datasets: [{
              label: "Income (₹)",
              data: income,
              fill: true,
              backgroundColor: "rgba(59,130,246,0.2)",
              borderColor: "#3b82f6",
              tension: 0.4,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => `₹${ctx.raw}`
                }
              }
            }
          }
        })
      );
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  return (
    <div className="analysis-container">
      {/* HEADER */}
      <div className="analysis-header">
        <h2>📊 Real-Time Analytics Overview</h2>
        <div className="date-filter">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button onClick={handleRefresh}>🔄 Refresh</button>
        </div>
      </div>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="summary-grid">
            <div className="summary-card">
              <p>Total Patients</p>
              <h3>{analyticsData?.summary?.totalPatients ?? 0}</h3>
            </div>
            <div className="summary-card">
              <p>Total Appointments</p>
              <h3>{analyticsData?.summary?.totalAppointments ?? 0}</h3>
            </div>
            <div className="summary-card">
              <p>Avg consultation Time</p>
              <h3>{analyticsData?.summary?.avgTime ?? 30} min</h3>
            </div>
            <div className="summary-card">
              <p>Total Income</p>
              <h3>₹{analyticsData?.summary?.totalIncome ?? 0}</h3>
            </div>
          </div>

          {/* MEDICINES */}
          <div className="analysis-card" style={{ marginBottom: "24px" }}>
            <h3>💊 Top Medicines Prescribed</h3>
            <ul className="medicine-list">
              {(analyticsData?.topMedicines || []).map((m, i) => (
                <li key={i}>{m} <span>#{i + 1}</span></li>
              ))}
            </ul>
          </div>

          {/* CHARTS GRID */}
          <div className="charts-grid-layout">
            <div className="analysis-card">
              <h3>📅 Daily Appointments</h3>
              <canvas ref={appointmentsRef}></canvas>
            </div>

            <div className="analysis-card">
              <h3>👥 Patient Count Trend</h3>
              <canvas ref={patientsRef}></canvas>
            </div>

            <div className="analysis-card">
              <h3>⏱ Avg Patient Time Trend</h3>
              <canvas ref={avgTimeRef}></canvas>
            </div>

            <div className="analysis-card">
              <h3>💰 Income Trend</h3>
              <canvas ref={incomeRef}></canvas>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analysis;
