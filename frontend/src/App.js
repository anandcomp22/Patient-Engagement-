import React from 'react';
import { Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Doctor/Dashboard/Sidebar';
import Navbar from './components/Doctor/Dashboard/Navbar';
import Dashboard from './components/Doctor/Dashboard/Dashboard';
import Patients from './components/Doctor/Dashboard/PatientsDetail'; 
import Appointments from './components/Doctor/Dashboard/Appointments';
import LiveVideoCall from './components/Doctor/VideoCallMech/LiveVideoCall';
import DoctorVideoCall from './components/Doctor/VideoCallMech/VideoCall';
import Prescriptions from './components/Doctor/Dashboard/Prescriptions';
import AboutUs from './components/Doctor/Dashboard/AboutUs';
import PatientSignUp from './components/Patient/PatientPortal/PatientSignUp';
import PatientAppointments from './components/Patient/Dashboard/PatientAppointments';
import BookAppointment from './components/Patient/Dashboard/BookAppointment';
import PatientDashboard from './components/Patient/Dashboard/PatientDashboard';
import HomePage from './components/Home/HomePage';
import DoctorSignin from './components/Doctor/DoctorPortal/DoctorSignin'; 
import DoctorSignUp from './components/Doctor/DoctorPortal/DoctorSignup';
import PatientLogin from './components/Patient/PatientPortal/PatientSignIn';
import PatientSidebar from './components/Patient/Dashboard/PatientSidebar';
import PatientNavbar from './components/Patient/Dashboard/PatientNavbar';
import PatientVideoCall from './components/Patient/VideoCallMech/PatientVideoCall';
import PayPalPaymentPage from './PaymentGateway/PayPalButton';
import Chatbot from './components/Patient/ChatBot/Chatbot'; 
import AnalysisPage from './components/Doctor/Dashboard/Analysis';
import DoctorSettings from './components/Doctor/DoctorSetting/DoctorSettings';
import UploadReport from './components/Patient/Dashboard/UploadedReport';
import AdminSidebar from "../src/components/Administration/AdminSidebar";
import AdminNavbar from "../src/components/Administration/AdminNavbar";
import AdminDashboard from "../src/components/Administration/AdminDashboard";
import AdminPayments from "../src/components/Administration/AdminPayments";
import AdminAnalytics from "../src/components/Administration/AdminAnalytics";
import AdminActivityLogs from "../src/components/Administration/AdminActivityLogs";
import AdminRoleManagement from "../src/components/Administration/AdminRoleManagement";
import AdminLogin from "../src/components/Administration/AdminLogin";
import AdminRegister from "../src/components/Administration/AdminRegister";
import AdminVerification from '../src/components/Administration/AdminDoctorVerification';
import AdminLayout from "../src/components/Administration/layouts/AdminLayout";


import './App.css';
import { LoginOutlined } from '@mui/icons-material';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  typography: {
    fontFamily: '"Roboto Slab", serif',
  },
});


function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/doctor/signin" element={<DoctorSignin />} />
          <Route path="/doctor/signup" element={<DoctorSignUp />} />
          <Route path="/patient/signin" element={<PatientLogin />} />
          <Route path="/patient/signup" element={<PatientSignUp />} />
          <Route path="/admin/auth/login" element={<AdminLogin />} />
          <Route path="/admin/auth/register" element={<AdminRegister />} />
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
                      <Route path="upload-report" element={<UploadReport />} />
                    </Routes>

                    <Chatbot />
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

          {/* ADMIN PORTAL */}
            <Route
              path="/admin/*"
              element={
                <Box sx={{ display: "flex" }}>
                  <AdminSidebar open={sidebarOpen} onToggle={toggleSidebar} />

                  <Box
                    sx={{
                      flexGrow: 1,
                      ml: sidebarOpen ? "250px" : "70px",
                      transition: "margin-left 0.3s ease-in-out",
                      mt: 8,
                      p: 3,
                    }}
                  >
                    <AdminNavbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />

                    {/* ✅ ADMIN ROUTES */}
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="verify" element={<AdminVerification />} />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="logs" element={<AdminActivityLogs />} />
                      <Route path="roles" element={<AdminRoleManagement />} />
                    </Routes>
                  </Box>
                </Box>
              }
            />
          </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;
