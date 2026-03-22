import React, { useEffect, useRef } from "react";
import "./Analysis.css";
import Chart from "chart.js/auto";
import AnalyticsStatCard from "./AnalysisStatCard";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";


const Analysis = () => {

  const appointmentsRef = useRef(null);
  const patientsRef = useRef(null);
  const avgTimeRef = useRef(null);
  const incomeRef = useRef(null);

  const chartInstances = useRef([]);

  const dates = ["01-04-2025", "02-04-2025", "03-04-2025"];
  const appointments = [12, 18, 9];
  const patients = [10, 15, 8];
  const avgTime = [30, 25, 36];
  const income = [500, 650, 400];

  const medicines = [
    "Paracetamol",
    "Azithromycin",
    "Amoxicillin",
    "Ibuprofen",
    "Cetirizine"
  ];

  useEffect(() => {
    renderCharts();

    return () => {
      chartInstances.current.forEach(chart => chart.destroy());
      chartInstances.current = [];
    };
  }, []);

  const renderCharts = () => {

    chartInstances.current.push(
      new Chart(appointmentsRef.current, {
        type: "bar",
        data: {
          labels: dates,
          datasets: [{
            data: appointments,
            backgroundColor: "#5aa9ff",
            borderRadius: 10
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      })
    );

    chartInstances.current.push(
      new Chart(patientsRef.current, {
        type: "bar",
        data: {
          labels: dates,
          datasets: [{
            data: patients,
            backgroundColor: "#3b82f6",
            borderRadius: 10
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      })
    );

    chartInstances.current.push(
      new Chart(avgTimeRef.current, {
        type: "line",
        data: {
          labels: dates,
          datasets: [{
            data: avgTime,
            borderColor: "#2563eb",
            tension: 0.4,
            pointRadius: 5
          }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      })
    );

    chartInstances.current.push(
      new Chart(incomeRef.current, {
        type: "line",
        data: {
          labels: dates,
          datasets: [{
            data: income,
            fill: true,
            backgroundColor: "rgba(59,130,246,0.3)",
            borderColor: "#3b82f6",
            tension: 0.4,
            pointRadius: 5
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
  };

  return (
    <div className="analysis-container">

      {/* HEADER */}
      <div className="analysis-header">
        <h2>📊 Analytics Overview</h2>
        <div className="date-filter">
          <input type="date" />
          <input type="date" />
          <button>🔄 Refresh</button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="summary-grid">
        <div className="summary-card"><p>Total Patients</p><h3>33</h3></div>
        <div className="summary-card"><p>Total Appointments</p><h3>39</h3></div>
        <div className="summary-card"><p>Avg Time (min)</p><h3>30</h3></div>
        <div className="summary-card"><p>Total Income</p><h3>₹1550</h3></div>
      </div>

      

      {/* MEDICINES */}
      <div className="analysis-card">
        <h3>💊 Top Medicines Prescribed</h3>
        <ul className="medicine-list">
          {medicines.map((m, i) => (
            <li key={i}>{m} <span>#{i + 1}</span></li>
          ))}
        </ul>
      </div>

      {/* CHARTS */}
      <div className="analysis-card">
        <h3>📅 Daily Appointments</h3>
        <canvas ref={appointmentsRef}></canvas>
      </div>

      <div className="analysis-card">
        <h3>👥 Patient Count</h3>
        <canvas ref={patientsRef}></canvas>
      </div>

      <div className="analysis-card">
        <h3>⏱ Avg Patient Time</h3>
        <canvas ref={avgTimeRef}></canvas>
      </div>

      <div className="analysis-card">
        <h3>💰 Monthly Income</h3>
        <canvas ref={incomeRef}></canvas>
      </div>

    </div>
  );
};

export default Analysis;
