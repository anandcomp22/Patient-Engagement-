import React from "react";
import { CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Dashboard/Navbar";
import Dashboard from "./components/Dashboard/Dashboard";
import Patients from "./components/Dashboard/Patients"; 
import Appointments from "./components/Dashboard/Appointments";
import "./App.css";

function App() {
  return (
    <Router>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Sidebar /> {/* Sidebar remains static */}
        <Box className="main-content">
          <Navbar /> {/* Navbar remains static */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/Appointments" element={<Appointments/>} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
