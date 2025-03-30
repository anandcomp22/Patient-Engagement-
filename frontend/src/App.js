import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Dashboard/Sidebar';
import Navbar from './components/Dashboard/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Dashboard/Patients'; 
import Appointments from './components/Dashboard/Appointments';
import LiveVideoCall from './components/Dashboard/LiveVideoCall';
import VideoCall from './components/Dashboard/VideoCall';
import Prescriptions from './components/Dashboard/Prescriptions';
import AboutUs from './components/Dashboard/AboutUs';
import PatientSignUp from './components/PatientPortal/PatientSignUp';
import PatientAppointments from './components/PatientPortal/PatientAppointments';
import BookAppointment from './components/PatientPortal/BookAppointment';
import PatientDashboard from './components/PatientPortal/PatientDashboard';
import HomePage from './components/Home/HomePage';
import DoctorLogin from './components/Auth/DoctorLogin';
import PatientLogin from './components/Auth/PatientLogin';
import './App.css';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        {/* Routes without Sidebar/Navbar */}
        <Route path="/" element={<HomePage />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route path="/patient/book" element={<BookAppointment />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />

        {/* Routes with Sidebar/Navbar */}
        <Route path="*" element={
          <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box className="main-content">
              <Navbar />
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/livevideocall" element={<LiveVideoCall />} />
                <Route path="/video-call/:id" element={<VideoCall />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/aboutus" element={<AboutUs />} />
              </Routes>
            </Box>
          </Box>
        } />
      </Routes>
    </Router>
  );
}

export default App;