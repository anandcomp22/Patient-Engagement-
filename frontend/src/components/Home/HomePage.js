import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Container,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import { 
  MedicalServices, 
  People,
  Home,
  Info,
  ContactMail,
  Star,
  Phone,
  NavigateNext,
  Visibility,
  LocalHospital,
  Favorite,
  Spa,
  Description,
  Vaccines,
  MonitorHeart,
  Psychology,
  MedicalInformation,
  Schedule,
  Videocam,
  SupportAgent,
  Groups
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const specialties = [
  "General Physician",
  "Dermatology",
  "Obstetrics & Gynaecology",
  "Orthopaedics",
  "ENT",
  "Neurology",
  "Cardiology",
  "Urology",
  "Gastroenterology/GI",
  "Psychiatry",
  "Paediatrics",
  "Pulmonology/Respiratory",
  "Endocrinology",
  "Nephrology",
  "Neurosurgery",
  "Rheumatology",
  "Ophthalmology",
  "Surgical Gastroenterology",
  "Infectious Disease",
  "General & Laparoscopic Surgery",
  "Psychology",
  "Medical Oncology",
  "Diabetology",
  "Dentist"
];

const patientFeatures = [
  { icon: <Visibility />, name: "Cataract Detection", desc: "AI-powered analysis of eye scans for cataract detection" },
  { icon: <LocalHospital />, name: "Pneumonia Detection", desc: "Automated detection from chest X-ray uploads" },
  { icon: <Favorite />, name: "Heart Disease Prediction", desc: "Risk assessment based on medical reports" },
  { icon: <Spa />, name: "Skin Infection Analysis", desc: "Dermatological condition analysis from images" },
  { icon: <Description />, name: "Report Analysis", desc: "Comprehensive medical report interpretation" },
  { icon: <Vaccines />, name: "Vaccination Reminders", desc: "Personalized vaccination schedules" },
  { icon: <MonitorHeart />, name: "Health Monitoring", desc: "Track vital signs and health metrics" },
  { icon: <Psychology />, name: "Mental Health Screening", desc: "Preliminary mental health assessments" },
  { icon: <MedicalInformation />, name: "Medication Management", desc: "Personalized medication tracking" }
];

const benefits = [
  { icon: <Schedule fontSize="large" />, title: "Easy Scheduling", description: "Book appointments at your convenience" },
  { icon: <Videocam fontSize="large" />, title: "Video Consultations", description: "Connect with doctors face-to-face online" },
  { icon: <Groups fontSize="large" />, title: "Expert Doctors", description: "Choose from qualified healthcare professionals" },
  { icon: <SupportAgent fontSize="large" />, title: "24/7 Support", description: "Access healthcare support anytime" }
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ bgcolor: '#1E5DA9' }}>
        <Toolbar>
          {/* Left side - Logo and Brand Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <MedicalServices sx={{ fontSize: 40, mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              AidME
            </Typography>
          </Box>

          {/* Right side - Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<Home />}
              sx={{ mx: 1 }}
              onClick={() => navigate('/')}
            >
              Home
            </Button>
            <Button 
              color="inherit" 
              startIcon={<Star />}
              sx={{ mx: 1 }}
              onClick={() => navigate('/features')}
            >
              Features
            </Button>
            <Button 
              color="inherit" 
              startIcon={<Info />}
              sx={{ mx: 1 }}
              onClick={() => navigate('/about')}
            >
              About Us
            </Button>
            <Button 
              color="inherit" 
              startIcon={<ContactMail />}
              sx={{ mx: 1 }}
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </Button>
            
            {/* Login Button */}
            <Button 
              variant="outlined" 
              color="inherit"
              sx={{ ml: 2 }}
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg">
        {/* Login Options Section - Now at the top */}
        <Box sx={{ 
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 8
        }}>
          <Typography variant="h3" sx={{ mb: 4, fontWeight: 'bold', color: '#1E5DA9' }}>
            Welcome to AidME Healthcare
          </Typography>
          <Typography variant="h5" sx={{ mb: 6 }}>
            Please select your login option
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ 
                p: 4,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}>
                <MedicalServices sx={{ 
                  fontSize: 60,
                  color: '#1E5DA9',
                  mb: 2 
                }} />
                <Typography variant="h5" gutterBottom>
                  Doctor Login
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Access your doctor dashboard to manage appointments, prescriptions, and patient records.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: '#1E5DA9',
                    '&:hover': { bgcolor: '#154281' }
                  }}
                  onClick={() => navigate('/doctor/login')}
                >
                  Doctor Portal
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ 
                p: 4,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}>
                <People sx={{ 
                  fontSize: 60,
                  color: '#1E5DA9',
                  mb: 2 
                }} />
                <Typography variant="h5" gutterBottom>
                  Patient Login
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Access your patient portal to book appointments, view prescriptions, and connect with doctors.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{
                    bgcolor: '#1E5DA9',
                    '&:hover': { bgcolor: '#154281' }
                  }}
                  onClick={() => navigate('/patient/login')}
                >
                  Patient Portal
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* What is AidME Section */}
        <Box sx={{ 
          backgroundColor: '#f0f7ff',
          borderRadius: 2,
          p: 4,
          mb: 6,
          borderLeft: '4px solid #1E5DA9'
        }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#1E5DA9' }}>
            What is AidME?
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            AidME is a comprehensive healthcare platform that connects patients with qualified doctors,
            making healthcare accessible and convenient. Our mission is to bridge the gap between
            patients and healthcare providers through innovative technology.
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            With AidME, you can:
          </Typography>
          <ul style={{ marginLeft: '20px' }}>
            <li>Find and book appointments with specialized doctors</li>
            <li>Access your medical records securely</li>
            <li>Get virtual consultations from the comfort of your home</li>
            <li>Manage prescriptions and receive medication reminders</li>
          </ul>
        </Box>

        {/* Browse by Specialties Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1E5DA9' }}>
            Browse by Specialties
          </Typography>
          <Grid container spacing={2}>
            {specialties.map((specialty, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    textTransform: 'none',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    borderColor: '#e0e0e0',
                    '&:hover': {
                      borderColor: '#1E5DA9',
                      backgroundColor: '#f0f7ff'
                    }
                  }}
                  onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(specialty)}`)}
                >
                  {specialty}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Provided by AidME Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1E5DA9' }}>
            Features Provided by AidME
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Our advanced healthcare platform offers these innovative features to patients:
          </Typography>
          <Grid container spacing={3}>
            {patientFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper elevation={2} sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#1E5DA9', 
                      mr: 2,
                      width: 40,
                      height: 40
                    }}>
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {feature.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {feature.desc}
                  </Typography>
                  <Button 
                    size="small" 
                    sx={{ 
                      color: '#1E5DA9',
                      fontWeight: 'bold'
                    }}
                    onClick={() => navigate('/upload')}
                  >
                    Try Now →
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ mb: 8, mt: 4 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1E5DA9', textAlign: 'center' }}>
            Why Choose AidME?
          </Typography>
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper elevation={3} sx={{ 
                  p: 3, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}>
                  <Box sx={{ 
                    color: '#1E5DA9',
                    mb: 2
                  }}>
                    {benefit.icon}
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body1">
                    {benefit.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Find Doctors Section */}
        <Box sx={{ mt: 4, mb: 6 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
            <Link 
              underline="hover" 
              color="inherit" 
              href="/" 
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Home sx={{ mr: 0.5 }} fontSize="inherit" />
              Home
            </Link>
            <Typography color="text.primary">Find Doctors</Typography>
          </Breadcrumbs>

          <Typography variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
            Find the right doctor for your ailments
          </Typography>
          
          <Chip
            icon={<Phone />}
            label="Call +91-8040245807 to book an appointment"
            variant="outlined"
            sx={{ 
              p: 2,
              fontSize: '1rem',
              bgcolor: '#f5f5f5',
              borderColor: '#1E5DA9'
            }}
          />
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          backgroundColor: '#fff',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          borderTop: '1px solid rgba(0,0,0,0.12)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1E5DA9' }}>
                AidME
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Making healthcare accessible to everyone
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>Home</Link>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>Features</Link>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>About Us</Link>
                <Link href="#" color="inherit">Contact</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>Find Doctors</Link>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>Video Consultations</Link>
                <Link href="#" color="inherit" sx={{ mb: 1 }}>Health Records</Link>
                <Link href="#" color="inherit">Medication Tracking</Link>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                Contact Us
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <Phone fontSize="small" sx={{ mr: 1 }} /> +91-9552111011
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <ContactMail fontSize="small" sx={{ mr: 1 }} /> support@aidme.com
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} AidME Healthcare. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;