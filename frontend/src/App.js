import React from "react";
import { CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Dashboard/Navbar";
import Dashboard from "./components/Dashboard/Dashboard";
import Patients from "./components/Dashboard/Patients"; 
import Appointments from "./components/Dashboard/Appointments";
import LiveVideoCall from "./components/Dashboard/LiveVideoCall";
import VideoCall from "./components/Dashboard/VideoCall";
import Prescriptions from "./components/Dashboard/Prescriptions";
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
            <Route path="/LiveVideoCall" element={<LiveVideoCall />} />
            <Route path="/video-call/:id" element={<VideoCall />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;