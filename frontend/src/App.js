import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
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
import DoctorSignUp from './components/Doctor/DoctorPortal/DoctorSignup';
import PatientSidebar from './components/Patient/Dashboard/PatientSidebar';
import PatientNavbar from './components/Patient/Dashboard/PatientNavbar';
import PatientVideoCall from './components/Patient/VideoCallMech/PatientVideoCall';
import PatientPrescriptions from './components/Patient/Dashboard/PatientPrescriptions';
import DiseaseDetection from './components/Patient/Dashboard/DiseaseDetection';
import PayPalPaymentPage from './PaymentGateway/PayPalButton';

import AnalysisPage from './components/Doctor/Dashboard/Analysis';
import DoctorSettings from './components/Doctor/DoctorSetting/DoctorSettings';
import UploadReport from './components/Patient/Dashboard/UploadedReport';
import AdminSidebar from "./components/Administration/AdminSidebar";
import AdminNavbar from "./components/Administration/AdminNavbar";
import AdminDashboard from "./components/Administration/AdminDashboard";
import AdminPayments from "./components/Administration/AdminPayments";
import AdminAnalytics from "./components/Administration/AdminAnalytics";
import AdminActivityLogs from "./components/Administration/AdminActivityLogs";
import AdminRoleManagement from "./components/Administration/AdminRoleManagement";
import AdminLogin from "./components/Administration/AdminLogin";
import AdminRegister from "./components/Administration/AdminRegister";
import AdminVerification from './components/Administration/AdminDoctorVerification';
import AdminDoctorsPage from "./components/Administration/AdminDoctors";
import AdminPatientsPage from "./components/Administration/AdminPatients";
import VerifyPrescription from './components/Common/VerifyPrescription';


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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Auto-close sidebar when switching to mobile, auto-open on desktop
  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Close sidebar on navigation for mobile
  const handleMobileClose = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/doctor/signup" element={<DoctorSignUp />} />
          <Route path="/patient/signup" element={<PatientSignUp />} />
          <Route path="/admin/auth/login" element={<AdminLogin />} />
          <Route path="/admin/auth/register" element={<AdminRegister />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path="/paypal" element={<PayPalPaymentPage />} />
          <Route path="/verify-prescription/:payload" element={<VerifyPrescription />} />

          {/* Patient portal */}
          <Route
            path="/patient/*"
            element={
              <Box sx={{ display: 'flex' }}>
                <PatientSidebar open={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} onMobileClose={handleMobileClose} />
                  <Box
                    sx={{
                      flexGrow: 1,
                      ml: isMobile ? 0 : (sidebarOpen ? '240px' : '62px'),
                      transition: 'margin-left 0.3s ease-in-out',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                  <PatientNavbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />
                  <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, mt: 8 }}>
                    <Routes>
                      <Route path="dashboard" element={<PatientDashboard />} />
                      <Route path="appointments" element={<PatientAppointments />} />
                      <Route path="book" element={<BookAppointment />} />
                      <Route path="video-call" element={<PatientVideoCall />} />
                      <Route path="upload-report" element={<UploadReport />} />
                      <Route path="prescriptions" element={<PatientPrescriptions />} />
                      <Route path="disease-detection" element={<DiseaseDetection />} />
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
                <Sidebar open={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} onMobileClose={handleMobileClose} />

                {/* Main content area shifts with sidebar */}
                <Box
                  className="main-content"
                  sx={{
                    flexGrow: 1,
                    ml: isMobile ? 0 : (sidebarOpen ? '250px' : '72px'),
                    transition: 'margin-left 0.3s ease-in-out',
                    p: { xs: 1, sm: 2, md: 3 },
                    mt: 8,
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  <Navbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

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
                  <AdminSidebar open={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} onMobileClose={handleMobileClose} />

                  <Box
                    sx={{
                      flexGrow: 1,
                      ml: isMobile ? 0 : (sidebarOpen ? "250px" : "70px"),
                      transition: "margin-left 0.3s ease-in-out",
                      mt: 8,
                      p: { xs: 1, sm: 2, md: 3 },
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    <AdminNavbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} isMobile={isMobile} />

                    {/* ✅ ADMIN ROUTES */}
                    <Routes>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="verify"    element={<AdminVerification />} />
                      <Route path="doctors"   element={<AdminDoctorsPage />} />
                      <Route path="patients"  element={<AdminPatientsPage />} />
                      <Route path="payments"  element={<AdminPayments />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="logs"      element={<AdminActivityLogs />} />
                      <Route path="roles"     element={<AdminRoleManagement />} />
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
