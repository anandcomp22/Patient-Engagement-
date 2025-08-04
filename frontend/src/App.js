import React from 'react';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Dashboard/Sidebar';
import Navbar from './components/Dashboard/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Dashboard/PatientsDetail'; 
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
import AnalysisPage from './components/Dashboard/Analysis';
import DoctorSettings from './components/Dashboard/DoctorSetting/DoctorSettings';
import './App.css';
import { LoginOutlined } from '@mui/icons-material';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <Router>
      <CssBaseline />

      {/* Chatbot visible on all pages */}
      <Chatbot />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/doctor/signin" element={<DoctorSignin />} />
        <Route path="/doctor/signup" element={<DoctorSignUp />} />
        <Route path="/patient/signin" element={<PatientLogin />} />
        <Route path="/patient/signup" element={<PatientSignUp />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/paypal" element={<PayPalPaymentPage />} />

        {/* Patient portal */}
        <Route
          path="/patient/*"
          element={
            <Box sx={{ display: 'flex' }}>
              <PatientSidebar open={sidebarOpen} onToggle={toggleSidebar} />
                <Box
                  sx={{
                    flexGrow: 1,
                    ml: sidebarOpen ? '250px' : '62px',
                    transition: 'margin-left 0.3s ease-in-out',
                  }}
                >
                <PatientNavbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar}/>
                <Box sx={{ p: 3, mt: 8 }}>
                  <Routes>
                    <Route path="dashboard" element={<PatientDashboard />} />
                    <Route path="appointments" element={<PatientAppointments />} />
                    <Route path="book" element={<BookAppointment />} />
                    <Route path="video-call" element={<PatientVideoCall />} />
                  </Routes>
                </Box>
              </Box>
            </Box>
          }
        />

        {/* Doctor portal */}
        <Route
          path="/doctor/*"
          element={
            <Box sx={{ display: 'flex' }}>
              {/* Sidebar with toggle */}
              <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

              {/* Main content area shifts with sidebar */}
              <Box
                className="main-content"
                sx={{
                  flexGrow: 1,
                  ml: sidebarOpen ? '250px' : '72px',
                  transition: 'margin-left 0.3s ease-in-out',
                  p: 3,
                  mt: 8
                }}
              >
                <Navbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />

                <Routes>
                  <Route path="dashboard" element={<Dashboard sidebarOpen={sidebarOpen} />} />
                  <Route path="patients" element={<Patients />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="livevideocall" element={<LiveVideoCall />} />
                  <Route path="video-call" element={<DoctorVideoCall />} />
                  <Route path="prescriptions" element={<Prescriptions />} />
                  <Route path="analysis" element={<AnalysisPage />} />
                  <Route path="settings" element={<DoctorSettings />} />
                  <Route path="logout" element={<LoginOutlined />} />
                </Routes>
              </Box>
            </Box>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
