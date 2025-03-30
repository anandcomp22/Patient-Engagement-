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
import PatientLogin from './components/Auth/PatientSignIn';
import PatientSidebar from './components/PatientPortal/PatientSidebar';
import PatientNavbar from './components/PatientPortal/PatientNavbar';
import './App.css';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/patient/signin" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />

        <Route path="/patient/*" element={
          <Box sx={{ display: 'flex' }}>
            <PatientSidebar />
            <Box className="main-content" sx={{ flexGrow: 1 }}>
              <PatientNavbar />
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="book" element={<BookAppointment />} />
                <Route path="video-call" element={<VideoCall />} />
                <Route path="video-call/:id" element={<VideoCall />} />
              </Routes>
            </Box>
          </Box>
        } />

        <Route path="*" element={
          <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box className="main-content" sx={{ flexGrow: 1 }}>
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