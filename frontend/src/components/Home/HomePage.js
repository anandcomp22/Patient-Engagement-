import React, { useRef, useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, Paper, Grid, Container,Breadcrumbs,Link,Chip,Avatar,Divider,
   Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Checkbox, FormControlLabel,InputAdornment,IconButton, CircularProgress,Snackbar,Alert} from '@mui/material';
import { Favorite, ContactMail, Phone, NavigateNext, Visibility,
  LocalHospital, Spa, Description, Vaccines, MonitorHeart, Psychology, MedicalInformation,  CheckCircle, SentimentSatisfiedAlt, EventAvailable,PersonSearch, AdminPanelSettingsLock, 
  FlashOn, VisibilityOff} from '@mui/icons-material';
  import Close from "@mui/icons-material/Close";
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BoltIcon from '@mui/icons-material/Bolt';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const specialties = ["General Physician","Dermatology","Obstetrics & Gynaecology","Orthopaedics","ENT","Neurology","Cardiology","Urology","Gastroenterology/GI",
  "Psychiatry","Paediatrics","Pulmonology/Respiratory","Endocrinology","Nephrology","Neurosurgery","Rheumatology","Ophthalmology","Surgical Gastroenterology",
  "Infectious Disease","General & Laparoscopic Surgery","Psychology","Medical Oncology","Diabetology","Dentist" ];

const patientFeatures = [
  { 
    icon: <Visibility />, 
    name: "Cataract Detection", 
    desc: "AI-powered analysis of eye scans for cataract detection", 
    details: {
      text: "Our model uses Convolutional Neural Networks (CNN) to analyze retina images and detect cataracts at an early stage.",
      image: "/features/cataract.jpeg",
      model: "CNN (Convolutional Neural Network)",
      input: "Retina images uploaded by the patient",
      output: "Classification: Normal / Cataract (with severity score)",
      steps: [
        "Upload your eye scan image",
        "Preprocessing: resize and normalize the image",
        "CNN analyzes the scan for cloudiness and opacity",
        "Receive detailed report with severity and recommendations"
      ]
    }
  },
  { 
    icon: <LocalHospital />, 
    name: "Pneumonia Detection", 
    desc: "Automated detection from chest X-ray uploads", 
    details: {
      text: "Using a pre-trained deep learning model, the system detects pneumonia patterns in chest X-rays accurately.",
      image: "/features/pneumonia.jpeg",
      model: "CNN with Transfer Learning",
      input: "Chest X-ray images",
      output: "Classification: Normal / Pneumonia (with confidence score)",
      steps: [
        "Upload your chest X-ray",
        "Image preprocessing and normalization",
        "Deep learning model identifies lung inflammation",
        "Receive predictive report with confidence level"
      ]
    }
  },
  { 
    icon: <Favorite />, 
    name: "Heart Disease Prediction", 
    desc: "Risk assessment based on medical reports", 
    details: {
      text: "This ML model predicts the risk of heart disease based on patient medical data and lifestyle metrics.",
      image: "/features/heart.jpeg",
      model: "Random Forest Classifier",
      input: "Patient medical history, blood pressure, cholesterol, age, lifestyle data",
      output: "Risk score: Low / Medium / High",
      steps: [
        "Enter your health parameters",
        "Data preprocessing and feature scaling",
        "Random Forest model predicts heart disease risk",
        "Receive personalized advice and risk score"
      ]
    }
  },
  { 
    icon: <Spa />, 
    name: "Skin Infection Analysis", 
    desc: "Dermatological condition analysis from images", 
    details: {
      text: "The system classifies skin conditions using CNN, identifying infections, rashes, or acne accurately.",
      image: "/features/skin.jpeg",
      model: "CNN (Convolutional Neural Network)",
      input: "Patient-uploaded skin images",
      output: "Classification of skin condition with severity",
      steps: [
        "Upload skin image",
        "Preprocessing: resize, normalize, augment images",
        "CNN evaluates infection type and severity",
        "Receive treatment suggestions and care advice"
      ]
    }
  },
  { 
    icon: <Description />, 
    name: "Report Analysis", 
    desc: "Comprehensive medical report interpretation", 
    details: {
      text: "AI NLP model extracts key insights from medical reports and summarizes critical health information.",
      image: "/features/report.jpeg",
      model: "Transformer-based NLP (BERT)",
      input: "Medical report documents (PDF/Text)",
      output: "Summarized report highlighting key findings",
      steps: [
        "Upload medical report",
        "NLP extracts important data (diagnoses, metrics)",
        "AI summarizes insights in simple language",
        "Receive easy-to-understand report with highlights"
      ]
    }
  },
  { 
    icon: <Vaccines />, 
    name: "Vaccination Reminders", 
    desc: "Personalized vaccination schedules", 
    details: {
      text: "AI-driven scheduling system sends personalized reminders for upcoming vaccines.",
      image: "/features/vaccinations.jpeg",
      model: "Rule-based Scheduling + ML for personalization",
      input: "Patient vaccination history and age",
      output: "Next dose reminders and notifications",
      steps: [
        "Enter vaccination history",
        "AI calculates due dates and optimal schedule",
        "Receive notifications when doses are due",
        "Track completed vaccinations in patient portal"
      ]
    }
  },
  { 
    icon: <MonitorHeart />, 
    name: "Health Monitoring", 
    desc: "Track vital signs and health metrics", 
    details: {
      text: "The system monitors real-time vitals using wearable devices and predicts anomalies using ML models.",
      image: "/features/monitor.jpeg",
      model: "Time-series Anomaly Detection (LSTM/GRU)",
      input: "Heart rate, BP, oxygen levels, activity data",
      output: "Alerts for abnormal readings",
      steps: [
        "Connect wearable health devices",
        "Continuous monitoring of vitals",
        "ML model detects anomalies in real-time",
        "Receive alerts and recommendations if abnormal readings detected"
      ]
    }
  },
  { 
    icon: <Psychology />, 
    name: "Mental Health Screening", 
    desc: "Preliminary mental health assessments", 
    details: {
      text: "The system uses ML models to assess mental health based on patient responses and behavioral patterns.",
      image: "/features/mental.jpeg",
      model: "Logistic Regression + NLP",
      input: "Questionnaire responses, behavioral metrics",
      output: "Screening results: Normal / At Risk",
      steps: [
        "Answer a short questionnaire",
        "AI evaluates responses using NLP and statistical models",
        "Receive mental health screening results",
        "Get recommendations or resources for support"
      ]
    }
  },
  { 
    icon: <MedicalInformation />, 
    name: "Medication Management", 
    desc: "Personalized medication tracking", 
    details: {
      text: "The system tracks medications, schedules doses, and predicts adherence using AI algorithms.",
      image: "/features/medince.jpeg",
      model: "Rule-based scheduling + ML adherence prediction",
      input: "Patient prescriptions and dosage timings",
      output: "Medication reminders and adherence tracking",
      steps: [
        "Enter medication details",
        "AI schedules doses and sends reminders",
        "Predicts likelihood of missed doses",
        "Receive alerts and medication adherence report"
      ]
    }
  }
];



const benefits = [
  {
    icon: <VideocamIcon />,
    title: "Instant Video Consultations",
    description: "Connect with board-certified doctors in minutes through high-quality video calls. No waiting rooms, no travel time – just convenient healthcare from anywhere in the world."
  },
  {
    icon: <PersonIcon />,
    title: "World-Class Specialists",
    description: "Access to over 500 verified specialists across all medical fields. Every doctor is thoroughly vetted, licensed, and brings years of experience to your care."
  },
  {
    icon: <AccessTimeIcon />,
    title: "Round-the-Clock Support",
    description: "24/7 medical support and emergency consultations available whenever you need them. Healthcare assistance that never sleeps, ensuring peace of mind day and night."
  },
  {
    icon: <LockIcon />,
    title: "Enterprise-Grade Security",
    description: "Bank-level encryption and HIPAA-compliant infrastructure ensure your medical data remains completely confidential and secure at all times."
  },
  {
    icon: <AttachMoneyIcon />,
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden fees. Quality healthcare that’s affordable and accessible to everyone, with flexible payment options available."
  },
  {
    icon: <BoltIcon />,
    title: "Lightning Fast Access",
    description: "Get medical advice in minutes, not days. Our AI-powered system ensures quick appointment scheduling and instant prescription delivery to your pharmacy."
  }
];

const Navbar = () => {
  const navigate = useNavigate();

  const navButtonStyle = {
    position: "relative",
    color: "#1c2b4a",
    fontWeight: 500,
    textTransform: "none",
    backgroundColor: "transparent",
    fontSize: "0.95rem",
    "&::after": {
      content: '""',
      position: "absolute",
      left: 0,
      bottom: -6,
      width: "0%",
      height: "2px",
      backgroundColor: "#0d6efd",
      transition: "width 0.3s ease",
    },
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:hover::after": {
      width: "100%",
    },
  };

  return (
    <AppBar
      position="sticky"
        elevation={4}
        sx={{
          background: "linear-gradient(135deg, rgb(219, 236, 249) 0%, rgb(159, 212, 255) 100%)",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          transition: "all 0.4s ease",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          width: '100%',
        }}
    >
      <Toolbar
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          px: { xs: 2, md: 6 },
          minHeight: 72,
        }}
      >
        {/* LEFT — LOGO + BRAND */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src="/main1.png"
            alt="Icon"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
            }}
          />

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#787878", // ✅ Brand white
              letterSpacing: "0.5px",
            }}
          >
            AidME
          </Typography>
        </Box>

        {/* CENTER — NAV LINKS */}
        <Box sx={{ display: "flex", gap: 4, justifyContent: "center" }}>
          {["Home", "Features", "Specialties", "About", "Contact"].map((item) => (
            <Button
              key={item}
              sx={{
                color: "#787878", // ✅ White nav text
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.95rem",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: "0%",
                  height: "2px",
                  left: 0,
                  bottom: -4,
                  backgroundColor: "#406aff",
                  transition: "width 0.3s ease",
                },
                "&:hover::after": {
                  width: "100%",
                },
                "&:hover": {
                  backgroundColor: "transparent", // ✅ navbar shape unchanged
                },
              }}
              onClick={() => {
                if (item === "Home") 
                  document
                    .getElementById("header-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                if (item === "Features")
                  document
                    .getElementById("features-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                if (item === "Specialties")
                  document
                    .getElementById("specialties-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                if (item === "About") navigate("/aboutus");
                if (item === "Contact")
                  document
                    .getElementById("contact-section")
                    ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {item}
            </Button>
          ))}
        </Box>

        {/* RIGHT — ADMIN LOGIN */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#0d6efd",
              color: "#0d6efd",
              "&:hover": {
                backgroundColor: "#eef5ff",
                borderColor: "#0d6efd",
              },
            }}
            onClick={() => navigate("/admin/auth/login")}
          >
            Admin Login
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const HomePage = () => {
  const featuresRef = useRef(null);
  const contactRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loginType, setLoginType] = useState("doctor");

  const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });
    const [errors, setErrors] = useState({});
    const [verificationStatus, setVerificationStatus] = useState(() => {
      const savedStatus = localStorage.getItem('doctorVerificationStatus');
      return savedStatus ? JSON.parse(savedStatus) : null;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info');

    const [openSpecialty, setOpenSpecialty] = React.useState(false);
    const [selectedSpecialty, setSelectedSpecialty] = React.useState("");


      useEffect(() => {
    if (verificationStatus) {
      localStorage.setItem('doctorVerificationStatus', JSON.stringify(verificationStatus));
    }
  }, [verificationStatus]);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (loginType === "doctor" && verificationStatus !== 'verified') {
      newErrors.verification = 'Medical license must be verified';
      showSnackbar('Please complete license verification first', 'error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const endpoint = loginType === "doctor" 
        ? "http://localhost:8000/doctor/signin" 
        : "http://localhost:8000/patient/signin";

      const res = await axios.post(endpoint, formData);
      const data = res.data;

      if (loginType === "doctor") {
        localStorage.setItem("doctorName", `${data.doctor.firstName} ${data.doctor.lastName}`);
        localStorage.setItem("doctorEmail", data.doctor.email);
        
      } else {
        localStorage.setItem("patientName", `${data.patient.firstName} ${data.patient.lastName}`);
        localStorage.setItem("patientEmail", data.patient.email);
      }

      localStorage.setItem("token", data.token);

      showSnackbar("Login successful! Redirecting...", "success");

      setTimeout(() => {
        navigate(loginType === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
      }, 1000);

      } catch (err) {
        if (err.response?.status === 403) {
          showSnackbar(err.response.data.message, "error"); // Pending verification message
        } else {
          showSnackbar("Login failed: " + (err.response?.data?.message || err.message), "error");
        }
      } finally {
        setIsSubmitting(false);
      }
    };


  const handleCloseSnackbar = (event, reason) => {
  if (reason === 'clickaway') return;
  setSnackbarOpen(false);
};

  const handleOpen = (feature) => {
    setSelectedFeature(feature);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFeature(null);
  };

  return (
    <>
    <Navbar /> 

      {/* Main Content */}
      <Container maxWidth={true} >
        {/* HERO LOGIN SECTION */}
          <Box 
          id ="header-section"
            sx={{
              minHeight: "100vh",
              px: { xs: 2, md: 10 },
              display: "flex",
              alignItems: "center",
              background:
                "radial-gradient(circle at top, #eef6ff 0%, #ffffff 60%)",
            }}
          >
            <Grid container spacing={8} alignItems="center">
              {/* LEFT CONTENT */}
              <Grid item xs={12} md={6}>
                <Chip
                  icon={<FlashOn sx={{ color: "#ff9800" }} />}
                  label="Instant Booking"
                  sx={{
                    mb: 3,
                    px: 2,
                    py: 1,
                    borderRadius: 3,
                    bgcolor: "#ffffff",
                    fontWeight: 600,
                    boxShadow: 2,
                  }}
                />

                <Typography
                  variant="h2"
                  fontWeight={800}
                  sx={{ color: "#0b428f", lineHeight: 1.1 }}
                >
                  Healthcare <br />
                  That <br />
                  Understands <br />
                  You
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    mt: 3,
                    maxWidth: 520,
                    color: "#5f6f86",
                    fontSize: "1.05rem",
                    lineHeight: 1.7,
                  }}
                >
                  Experience the future of medicine with AI-driven diagnostics,
                  instant video consultations, and personalized care plans. Your
                  health journey, reimagined.
                </Typography>

                <Box sx={{ display: "flex", gap: 4, mt: 6 }}>
                  <Box>
                    <Typography variant="h4" fontWeight={800} color="#2d79d6">
                      10K+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Happy Patients
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800} color="#2d79d6">
                      500+
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doctors
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800} color="#2d79d6">
                      4.9
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* RIGHT LOGIN CARD */}
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={6}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    maxWidth: 420,
                    mx: "auto",
                    background: "linear-gradient(135deg, #f4f9ff, #ffffff)",
                    boxShadow: "0 20px 60px rgba(13,110,253,0.15)",
                  }}
                >
                  {/* LOGIN TOGGLE */}
                  <form onSubmit={handleSubmit}>
                  <Box sx={{ display: "flex", mb: 3 }}>
                    <Button
                      fullWidth
                      variant={loginType === "doctor" ? "contained" : "outlined"}
                      sx={{ borderRadius: 2 }}
                      onClick={() => setLoginType("doctor")}
                    >
                      Doctor Login
                    </Button>

                    <Button
                      fullWidth
                      variant={loginType === "patient" ? "contained" : "outlined"}
                      sx={{ ml: 1, borderRadius: 2 }}
                      onClick={() => setLoginType("patient")}
                    >
                      Patient Login
                    </Button>
                  </Box>

                  {/* TITLE */}
                  {/*<Typography variant="h6" fontWeight="bold" mb={2}>
                    {loginType === "doctor" ? "Doctor Portal" : "Patient Portal"}
                  </Typography>*/}

                  {/* EMAIL/USERNAME */}
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ mb: 0.5 }}
                  >
                    {loginType === "doctor" ? "Doctor ID / Email" : "Patient ID / Email"}
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder={loginType === "doctor" ? "Enter Doctor ID or Email" : "Enter Patient ID or Email"}
                    variant="outlined"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#dbe7ff",
                          borderWidth: 2,
                        },
                        "&:hover fieldset": {
                          borderColor: "#0d6efd",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#0d6efd",
                        },
                      },
                    }}
                    InputLabelProps={{ shrink: true }}
                  />

                  {/* PASSWORD */}
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    Password
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="••••••••"
                    variant="outlined"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    sx={{
                      mb: 0,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#dbe7ff",
                          borderWidth: 2,
                        },
                        "&:hover fieldset": {
                          borderColor: "#0d6efd",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#0d6efd",
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* REMEMBER ME & FORGOT PASSWORD */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
                    <FormControlLabel
                      control={<Checkbox checked={rememberMe} onChange={handleRememberMe} />}
                      label="Remember me"
                    />
                    <Link 
                      href="/doctor/forgot-password" 
                      variant="body2" 
                      sx={{ color: '#1E5DA9' }}
                    >
                    Forgot password?
                    </Link>
                  </Box>

                  {/* LOGIN BUTTON */}
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    {isSubmitting ? <CircularProgress size={24} sx={{ color: 'inherit', mr: 2 }} /> : null}
                    Sign In {loginType === "doctor" ? "Doctor" : "Patient"}
                  </Button>

                  {/* Snackbar for messages */}
                  <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={4000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  >
                    <Alert 
                      onClose={handleCloseSnackbar} 
                      severity={snackbarSeverity} 
                      variant="filled"
                      sx={{ width: '100%' }}
                    >
                      {snackbarMessage}
                    </Alert>
                  </Snackbar>
                  </form>

                  {/* REGISTER */}
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, textAlign: "center", color: "text.secondary" }}
                  >
                    Don&apos;t have an account?{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "primary.main",
                        fontWeight: 600,
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={() =>
                        navigate(
                          loginType === "doctor"
                            ? "/doctor/signup"
                            : "/patient/signup"
                        )
                      }
                    >
                      Register as {loginType === "doctor" ? "Doctor" : "Patient"}
                    </Box>
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

        {/* What is AidME Section */}
        <Box sx={{ 
          backgroundColor: '#f0f7ff',
          borderRadius: 2,
          p: 4,
          mb: 8,
          borderLeft: '4px solid #1E5DA9'
        }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#2a72caff' }}>
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
        <Box id="specialties-section" sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              background: 'linear-gradient(90deg, #6fadf8, #070a0c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(42,114,202,0.25)',
            }}
          >
            Browse by Specialties
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ mb: 4, textAlign: 'center', color: '#4a4a4a' }}
          >
            Multiple specialties to choose from for your healthcare needs
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
                      borderColor: "linear-gradient(135deg, #83c9fbff 0%, #0062b2ff 100%)",
                      backgroundColor: '#f0f7ff'
                    }
                  }}
                  onClick={() => {
                    setSelectedSpecialty(specialty);
                    setOpenSpecialty(true);
                  }}
                >
                  {specialty}
                </Button>
              </Grid>
            ))}
          </Grid>
          <Dialog
            open={openSpecialty}
            onClose={() => setOpenSpecialty(false)}
            maxWidth="sm"
            fullWidth
            BackdropProps={{
              sx: {
                backdropFilter: "blur(6px)",
                backgroundColor: "rgba(0,0,0,0.6)",
              },
            }}
            PaperProps={{
              sx: {
                borderRadius: 4,
                p: 3,
              },
            }}
          >
            {/* Close button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <IconButton onClick={() => setOpenSpecialty(false)}>
                <Close />
              </IconButton>
            </Box>

            {/* Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                mb: 1,
                color: "#0b5ed7",
              }}
            >
              {selectedSpecialty}
            </Typography>

            {/* Description */}
            <Typography variant="body2" sx={{ color: "#6b7a99", mb: 3 }}>
              Our advanced AI-powered system helps analyze symptoms related to{" "}
              <b>{selectedSpecialty}</b> and connects you with the right specialist
              instantly.
            </Typography>

            {/* Key Features */}
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Key Features:
            </Typography>

            <Box component="ul" sx={{ pl: 3, color: "#6b7a99" }}>
              <li>AI-assisted preliminary diagnosis</li>
              <li>Experienced & verified doctors</li>
              <li>Fast appointment booking</li>
              <li>Secure & confidential consultations</li>
            </Box>

            {/* Important note */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderLeft: "4px solid #0b5ed7",
                backgroundColor: "#f0f6ff",
                borderRadius: 1,
              }}
            >
              <Typography variant="body2">
                <b>Important:</b> This information is for guidance only. Always consult
                a licensed physician for diagnosis and treatment.
              </Typography>
            </Box>

            {/* Action */}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, borderRadius: 2 }}
              onClick={() =>
                navigate(`/doctors?specialty=${encodeURIComponent(selectedSpecialty)}`)
              }
            >
              Find Doctors
            </Button>
          </Dialog>

        </Box>

        {/* Features Provided by AidME Section */}
        <Box id="features-section" ref={featuresRef} sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              background: 'linear-gradient(90deg, #6fadf8, #004aa4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(42,114,202,0.25)',
            }}
          >
            Features Provided by AidME
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ mb: 6, textAlign: 'center', color: '#4a4a4a' }}
          >
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
                      bgcolor: '#2a72caff', 
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
                  <Button size="small" sx={{ color: '#2a72caff', fontWeight: 'bold' }} 
                  onClick={() => handleOpen(feature)}>Know Now →</Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Dialog Popup for Feature Details */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedFeature?.name}</DialogTitle>
          <DialogContent>
            {selectedFeature?.details?.image && (
              <Box component="img" src={selectedFeature.details.image} alt={selectedFeature.name} sx={{ width: '100%', mb: 2, borderRadius: 2 }} />
            )}
            <DialogContentText sx={{ mb: 2 }}>
              {selectedFeature?.details?.text}
            </DialogContentText>
            {selectedFeature?.details?.steps && (
              <Box component="ul" sx={{ pl: 3 }}>
                {selectedFeature.details.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">Close</Button>
          </DialogActions>
        </Dialog>

        {/* Benefits Section */}
        <Box sx={{ mb: 8, mt: 4 }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              background: 'linear-gradient(90deg, #6fadf8, #004aa4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(42,114,202,0.25)',
            }}
          >
            Why Choose AidME?
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ mb: 6, textAlign: 'center', color: '#4a4a4a' }}
          >
            Experience the benefits of modern healthcare technology combined with expert medical care
          </Typography>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper 
                  elevation={2} 
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    backgroundColor: '#f0f6ff',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-6px)' },
                  }}
                >
                  <Avatar sx={{ bgcolor: '#2a72caff', width: 56, height: 56 }}>
                    {benefit.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Success Rate Section with Animated Circular Progress */}
          <Box sx={{ mb: 8 }}>
            <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              textAlign: 'center',
              background: 'linear-gradient(90deg, #6fadf8, #004aa4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(42,114,202,0.25)',
            }}
          >
            Our Success Metrics
          </Typography>

            <Grid container spacing={4} justifyContent="center">
            {[
              { title: 'Success Rate', target: 98, icon: <CheckCircle sx={{ fontSize: 40, color: '#2a72ca' }} /> },
              { title: 'Patient Satisfaction', target: 96, icon: <SentimentSatisfiedAlt sx={{ fontSize: 40, color: '#2a72ca' }} /> },
              { title: 'Appointments', target: 95, icon: <EventAvailable sx={{ fontSize: 40, color: '#2a72ca' }} /> },
              { title: 'Doctor Availability', target: 97, icon: <PersonSearch sx={{ fontSize: 40, color: '#2a72ca' }} /> }
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    textAlign: 'center',
                    boxShadow: 3,
                    background: 'linear-gradient(135deg, #e3f2fd, #ffffff)',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-6px)' },
                  }}
                >
                  {item.icon}
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2a72ca', mt: 1 }}>
                    {item.target}%
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          </Box>

        {/* Find Doctors Section */}
        <Box id="contact-section" ref={contactRef} sx={{ mt: 4, mb: 6 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
            <Typography variant="h6" color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonSearch  sx={{ mr: 0.5 }} fontSize="inherit" />
              Find Doctors
            </Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: "#2a72caff"}}>
            Find the right doctor for your ailments
          </Typography>
          
          <Chip
            icon={<Phone />}
            label="Call +91-9552111011 to book an appointment"
            variant="outlined"
            sx={{ 
              p: 2,
              fontSize: '1rem',
              bgcolor: '#86c8ffff',
              background: 'linear-gradient(135deg, #9acff5, #e0eff9)',
            }}
          />
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: '#fff',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          borderTop: '1px solid rgba(0,0,0,0.12)'
        }}
      >
        <Container maxWidth="small">
          <Grid container spacing={4} gap={4}>
            {/* Brand */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1E5DA9' }}>
                AidME
              </Typography>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Making healthcare accessible to everyone
              </Typography>
            </Grid>

            {/* Quick Links & Services */}
            <Grid item xs={12} sm={2} md={5}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, flexWrap: 'wrap', justifyContent: 'space-between'}}>
                <Link href="#" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Find Doctors</Link>
                <Link href="#" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Video Consultations</Link>
                <Link href="#" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Health Records</Link>
                <Link href="#" underline="none" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>Medication Tracking</Link>
              </Box>
            </Grid>

            {/* Contact */}
            <Grid item xs={12} sm={6} md={3} sx={{ ml: 'auto', textAlign: { xs: 'center', sm: 'right' } }}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 'bold' }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">+91-9552111011</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ContactMail fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">support@aidme.com</Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Footer Bottom */}
          <Typography variant="body2" align="center" color="text.secondary">
            © {new Date().getFullYear()} AidME Healthcare. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;