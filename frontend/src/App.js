import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Dashboard/Sidebar';
import Navbar from './components/Dashboard/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Dashboard/Patients'; 
import Appointments from './components/Dashboard/Appointments';
import LiveVideoCall from './components/Dashboard/LiveVideoCall';
import DoctorVideoCall from './components/Dashboard/VideoCall';
import Prescriptions from './components/Dashboard/Prescriptions';
import AboutUs from './components/Dashboard/AboutUs';
import PatientSignUp from './components/PatientPortal/PatientSignUp';
import PatientAppointments from './components/PatientPortal/PatientAppointments';
import BookAppointment from './components/PatientPortal/BookAppointment';
import PatientDashboard from './components/PatientPortal/PatientDashboard';
import HomePage from './components/Home/HomePage';
import DoctorSignin from './components/DoctorPortal/DoctorSignin';
import DoctorSignUp from './components/DoctorPortal/DoctorSignup';
import PatientLogin from './components/PatientPortal/PatientSignIn';
import PatientSidebar from './components/PatientPortal/PatientSidebar';
import PatientNavbar from './components/PatientPortal/PatientNavbar';
import PatientVideoCall from './components/PatientPortal/PatientVideoCall';
import PayPalPaymentPage from './pages/PayPalPaymentPage';
import Chatbot from './components/PatientPortal/Chatbot'; 
import './App.css';

function App() {
  return (
    <Router>
      <CssBaseline />
      
      {/* Add the Chatbot here so it appears on all pages */}
      <Chatbot />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctor/signin" element={<DoctorSignin />} />
        <Route path="/doctor/signup" element={<DoctorSignUp />} />
        <Route path="/patient/signin" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />
        <Route path="/paypal" element={<PayPalPaymentPage />} />

        <Route path="/patient/*" element={
          <Box sx={{ display: 'flex' }}>
            <PatientSidebar />
            <Box className="main-content" sx={{ flexGrow: 1 }}>
              <PatientNavbar />
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="book" element={<BookAppointment />} />
                <Route path="video-call" element={<PatientVideoCall />} />
              </Routes>
            </Box>
          </Box>
        } />

        <Route path="/doctor/*" element={
          <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box className="main-content" sx={{ flexGrow: 1 }}>
              <Navbar />
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="livevideocall" element={<LiveVideoCall />} />
                <Route path="video-call/:id" element={<DoctorVideoCall />} />
                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="aboutus" element={<AboutUs />} />
              </Routes>
            </Box>
          </Box>
        } />
      </Routes>
    </Router>
  );
}

export default App;
