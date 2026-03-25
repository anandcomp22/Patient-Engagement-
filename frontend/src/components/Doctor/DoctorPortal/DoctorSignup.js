import React, { useState, useRef } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../../../apiConfig";
import { Box, Typography, TextField, Button, Grid, IconButton,
  FormControl, OutlinedInput, InputAdornment, MenuItem, Select,
  Card, CardContent, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, List, ListItem, ListItemIcon, ListItemText,
  LinearProgress, Alert, CircularProgress, FormHelperText, FormControlLabel,
  Checkbox, Snackbar, Link,
  Paper
} from "@mui/material";

import {
  Visibility, VisibilityOff, Badge, CloudUpload, Upload,
  Description, Info, CheckCircle, VerifiedUser, Error, Cancel,
  Warning, Help, LocalHospital,
} from "@mui/icons-material";
import bgImage from './img/P.png';
 

// Sample location and specialty data
const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
const statesByCountry = {
  'India': ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi'],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
  // Add other countries and their states
};
const districtsByState = {
  'Karnataka': ['Bangalore Urban', 'Mysore', 'Belgaum', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  // Add other states and their districts
};
const specialties = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology', 'Oncology','Pediatrics','Psychiatry','Radiology','Surgery'];
const qualifications = ['MBBS', 'MD', 'MS', 'DM', 'MCh', 'PhD', 'DNB'];

const DoctorSignUp = () => {
const navigate = useNavigate();

const [isSubmitting, setIsSubmitting] = useState(false);

const [snackbarOpen, setSnackbarOpen] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState("");
const [snackbarSeverity, setSnackbarSeverity] = useState("info");


const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
const [verificationStep, setVerificationStep] = useState(1);
const [verificationStatus, setVerificationStatus] = useState('');
const [licenseFile, setLicenseFile] = useState(null);
const [uploadProgress, setUploadProgress] = useState(0);
const fileInputRef = useRef(null);
const [showPassword, setShowPassword] = useState(false);
const [profileImage, setProfileImage] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    licenseNumber: '',
    specialty: '', 
    qualifications: [],
    experience: '',
    hospital: '',
    country: '',
    state: '',
    district: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [errors, setErrors] = useState({});
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'country') {
      setAvailableStates(statesByCountry[value] || []);
      setFormData(prev => ({ ...prev, state: '', district: '' }));
      setAvailableDistricts([]);
    } else if (name === 'state') {
      setAvailableDistricts(districtsByState[value] || []);
      setFormData(prev => ({ ...prev, district: '' }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

const handleRetryVerification = () => {
  setVerificationStep(1);
  setVerificationStatus("");
  setUploadProgress(0);
  setLicenseFile(null);
};

const handleCloseSnackbar = () => {
  setSnackbarOpen(false);
};


  // Close dialog
const handleCloseVerificationDialog = () => {
  setVerificationDialogOpen(false);
};

// Trigger file input
const handleTriggerUpload = () => {
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
};

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setProfileImage(file);
  setImagePreview(URL.createObjectURL(file));
};


// Handle file upload
const handleLicenseUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    setLicenseFile(file); // ✅ REQUIRED
    setUploadProgress(30); // fake progress step
    setVerificationStep(2);
    setTimeout(() => setUploadProgress(100), 1500); // simulate upload
    setTimeout(() => {
      setVerificationStatus("pending"); // simulate success
      setVerificationStep(3);
    }, 2500);
  }
};


  const handleQualificationChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData(prev => ({
      ...prev,
      qualifications: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const inputStyle = {
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

    mb: 1,
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Medical license number is required';
    }
    
    if (!formData.specialty) newErrors.specialty = 'Specialty is required';
    if (formData.qualifications.length === 0) newErrors.qualifications = 'At least one qualification is required';
    
    if (!formData.experience) {
      newErrors.experience = 'Years of experience is required';
    } else if (isNaN(formData.experience) || formData.experience < 0 || formData.experience > 60) {
      newErrors.experience = 'Please enter valid experience (0-60)';
    }
    
    if (!formData.hospital.trim()) newErrors.hospital = 'Hospital/Clinic name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.district) newErrors.district = 'District is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.password !== formData.confirmPassword) {
    setSnackbarSeverity("error");
    setSnackbarMessage("Passwords do not match");
    setSnackbarOpen(true);
    return;
  }

  if (!licenseFile) {
    setSnackbarSeverity("error");
    setSnackbarMessage("Please upload your medical license");
    setSnackbarOpen(true);
    return;
  }

  if (!validate()) return;

  try {
    setIsSubmitting(true);

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "confirmPassword" && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => form.append(`${key}[]`, v));
        } else {
          form.append(key, value);
        }
      }
    });

    if (profileImage) {
      form.append("profileImage", profileImage);
    }

    if (licenseFile) {
      form.append("license", licenseFile); 
    }
    form.append("verificationStatus", "pending");
    form.append("isVerified", false);


    const response = await axios.post(
      `${API_BASE}/doctor/signup`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (response.status === 201) {
      setSnackbarMessage(
          "Doctor registered successfully. Please login to continue."
        );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      setTimeout(() => {
        navigate("/");
      }, 1000);

    }
  } catch (err) {
    setSnackbarMessage(err.response?.data?.message || "Registration failed");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  } finally {
    setIsSubmitting(false);
  }
};
  
  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImage})`,
        minHeight: "100vh",
        px: { xs: 2, md: 10 },
        display: "flex",
        alignItems: "center",
        width: "100%",
        background: "radial-gradient(circle at top, #eef6ff 0%, #ffffff 60%)",
      }}
    >
    <Grid
      container
      spacing={3}
      sx={{ height: "100vh" }} 
    >
      <Grid
        item
        xs={12}
        md={4}
        sx={{
          position: "sticky",
          top: 200,
          height: "fit-content"
        }}
      >
        <Chip
          icon={<LocalHospital />}
          label="Doctor Registration"
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

        <Typography variant="h3" fontWeight="800" color="#0b428f" lineHeight={1.2}>
          Join Our Medical
          <br />
          Network
        </Typography>

        <Typography
          variant="body1"
          sx={{ mt: 3, color: "#5f6f86", maxWidth: 520, lineHeight: 1.7 }}
        >
          Register as a verified doctor to consult patients,<br /> manage appointments,
          and access the healthcare platform.
        </Typography>
      </Grid>

      
      <Grid
          item
          xs={12}
          md={8}
          sx={{
            height: "100vh",
            pr: 1 
          }}
        >
        <Paper
            elevation={6}
            sx={{
              p: 2.5,
              borderRadius: 4,
              width: "100%",
              mx: "auto",
              background: "linear-gradient(135deg, #f4f9ff, #ffffff)",
              boxShadow: "0 20px 60px rgba(13,110,253,0.15)",
              mt: 10,
              mb: 10
            }}
          >
            <form onSubmit={handleSubmit} sx={{ mt: 2, width: "100%" }}>
              <Box sx={{ display: "flex", mb: 4, gap: 2, justifyContent: 'space-between', alignItems: 'center', px: 20}}>
                <Button
                  variant={RegisterType === "doctor" ? "contained" : "outlined"}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                  }}
                  onClick={() => navigate("/")}
                >
                  Doctor Register 
                </Button>
              </Box>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>First Name</Typography>
            <TextField
              fullWidth
              name="firstName"
              size="small"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Middle Name</Typography>
            <TextField
              fullWidth
              size="small"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              error={!!errors.middleName}
              helperText={errors.middleName}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Last Name</Typography>
            <TextField
              fullWidth
              size="small"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              sx={inputStyle}
            />
          </Grid>
          </Grid>

          <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Date of Birth</Typography>
            <TextField
              fullWidth
              type="date"
              size="small"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              sx={inputStyle}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Medical License Number</Typography>
            <TextField
              fullWidth
              name="licenseNumber"
              size="small"
              value={formData.licenseNumber}
              onChange={handleChange}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber}
              sx={inputStyle}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Years of Experience</Typography>
            <TextField
              fullWidth
              name="experience"
              type="number"
              size="small"
              value={formData.experience}
              onChange={handleChange}
              error={!!errors.experience}
              helperText={errors.experience}
              sx={inputStyle}
              InputProps={{
                inputProps: { min: 0, max: 60 }
              }}
            />
          </Grid>
          </Grid>

          <Grid container spacing={1.5}>
          <Grid item xs={12} md={5}>
            <Typography variant="body2" fontWeight={600}>Email</Typography>
            <TextField
              fullWidth
              name="email"
              size="small"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={inputStyle}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Typography variant="body2" fontWeight={600}>Phone Number</Typography>
            <TextField
              fullWidth
              name="phone"
              size="small"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              sx={inputStyle}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" fontWeight={600}>Specialty</Typography>
            <FormControl fullWidth error={!!errors.specialty} size="small">
              <Select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                sx={{
                  ...inputStyle,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe7ff",
                    borderWidth: 2,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                }}
              >
                {specialties.map((specialty) => (
                  <MenuItem key={specialty} value={specialty}>
                    {specialty}
                  </MenuItem>
                ))}
              </Select>
              {errors.specialty && <FormHelperText>{errors.specialty}</FormHelperText>}
            </FormControl>
          </Grid>
          </Grid>

          <Grid container spacing={1.5} >
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Qualifications</Typography>
            <FormControl fullWidth error={!!errors.qualifications} size="small">
              <Select
                multiple
                name="qualifications"
                value={formData.qualifications}
                onChange={handleQualificationChange}
                renderValue={(selected) => selected.join(', ')}
                sx={{
                  ...inputStyle,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dbe7ff",
                    borderWidth: 2,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#0d6efd",
                  },
                }}
              >
                {qualifications.map((qualification) => (
                  <MenuItem key={qualification} value={qualification}>
                    {qualification}
                  </MenuItem>
                ))}
              </Select>
              {errors.qualifications && <FormHelperText>{errors.qualifications}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="body2" fontWeight={600}>Hospital/Clinic Name</Typography>
            <TextField
              fullWidth
              name="hospital"
              size="small"
              value={formData.hospital}
              onChange={handleChange}
              error={!!errors.hospital}
              helperText={errors.hospital}
              sx={inputStyle}
            />
          </Grid>
          </Grid>

          <Grid container spacing={1.5}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>Country</Typography>
            <FormControl fullWidth error={!!errors.country} size="small">
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                sx={inputStyle}
              >
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
              {errors.country && <FormHelperText>{errors.country}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>State</Typography>
            <FormControl fullWidth error={!!errors.state} size="small">
              <Select
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={!formData.country}
                sx={inputStyle}
              >
                {availableStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
              {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" fontWeight={600}>District</Typography>
            <FormControl fullWidth error={!!errors.district} size="small" >
              <Select
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!formData.state}
                sx={inputStyle}
              >
                {availableDistricts.map((district) => (
                  <MenuItem key={district} value={district}>
                    {district}
                  </MenuItem>
                ))}
              </Select>
              {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
            </FormControl>
          </Grid>
          </Grid>

          <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Typography variant="body2" fontWeight={600}>Password</Typography>
            <FormControl fullWidth variant="outlined" error={!!errors.password} size="small">
              <OutlinedInput
                name="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#dbe7ff",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0d6efd",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0d6efd",
                    },
                  }}
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.8 }}>
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                }
                />
                {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
              </FormControl>
            </Grid>
  
            <Grid item xs={12} mb={4}>
              <Typography variant="body2" fontWeight={600}>Confirm Password</Typography>
              <FormControl fullWidth variant="outlined" error={!!errors.confirmPassword} size="small">
                <OutlinedInput
                  name="confirmPassword"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: "#ffffff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#dbe7ff",
                        borderWidth: 2,
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d6efd",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#0d6efd",
                      },
                    }}
                  endAdornment={
                    <InputAdornment position="end">
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.8 }}>
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Box>
                    </InputAdornment>
                  }
                />
                {errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
              </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>

            {/* LEFT — Profile Photo */}
            <Grid item xs={12} md={6}>
              <Paper elevation={6} sx={{ p: 1.7, borderRadius: 3 }}>
                <Typography fontWeight="bold" mb={2}>
                  Profile Photo
                </Typography>

                <Box display="flex" alignItems="center" gap={4}>
                  <Avatar
                    src={imagePreview}
                    sx={{ width: 50, height: 50 }}
                  />

                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                  >
                    {profileImage ? "Update Photo" : "Upload Photo"}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>
              </Paper>
            </Grid>


            {/* RIGHT — License Verification */}
            <Grid item xs={12} md={6}>
              <Paper elevation={6} sx={{ p: 2, borderRadius: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  mb={2}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Badge /> License Verification
                </Typography>
                      
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={
                      verificationStatus === 'verified' ? 'Verified' :
                      verificationStatus === 'pending' ? 'Verification in Progress' :
                      verificationStatus === 'rejected' ? 'Verification Failed' :
                      'Not Verified'
                      }
                    color={
                      verificationStatus === 'verified' ? 'success' :
                      verificationStatus === 'pending' ? 'warning' :
                      verificationStatus === 'rejected' ? 'error' : 'default'
                      }
                    avatar={
                      verificationStatus === 'verified' ? (
                        <Avatar sx={{ bgcolor: 'success.main' }}><VerifiedUser /></Avatar>
                          ) : verificationStatus === 'pending' ? (
                        <Avatar sx={{ bgcolor: 'warning.main' }}><CircularProgress size={20} color="inherit" /></Avatar>
                          ) : verificationStatus === 'rejected' ? (
                        <Avatar sx={{ bgcolor: 'error.main' }}><Error /></Avatar>
                          ) : (
                        <Avatar><Badge /></Avatar>
                          )
                        }
                      sx={{ flexShrink: 0 }}
                    />
                        
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {verificationStatus === 'verified' ? 'Your license has been verified and approved' :
                        verificationStatus === 'pending' ? 'Verification process in progress' :
                        verificationStatus === 'rejected' ? 'License verification failed. Please try again.' :
                         'License verification required'}
                      </Typography>
                    </Box>
                        
                    <Button 
                      variant="outlined"
                      startIcon={<CloudUpload/>}
                      onClick={() => setVerificationDialogOpen(true)}
                      sx={{
                        borderRadius: 3,
                        backgroundColor: "#ffffff",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#dbe7ff",
                          borderWidth: 5,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0d6efd",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#0d6efd",
                        },
                        size: 'small'
                      }}
                    >
                    {verificationStatus ? 'Update' : 'Verify'}
                    </Button>
                  </Box>

                  {verificationStatus === 'rejected' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Verification failed. Please upload a valid license document.
                    </Typography>
                  </Alert>
                )}
                    </Paper>
                  </Grid>
              </Grid>

        {errors.verification && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.verification}
          </Alert>
        )}

        <Dialog 
          open={verificationDialogOpen} 
          onClose={handleCloseVerificationDialog} 
          fullWidth 
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid #eee', 
            pb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#f9f9f9'
          }}>
            <Badge color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="div">
              Medical License Verification
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 3 }}>
            {verificationStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CloudUpload sx={{ 
                  fontSize: 60, 
                  color: '#1E5DA9', 
                  mb: 2,
                  opacity: 0.8
                }} />
                
                <Typography variant="h6" gutterBottom>
                  Upload Your Medical License
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please upload a clear photo or scan of your medical license certificate.
                  Supported formats: JPG, PNG, PDF (Max 5MB)
                </Typography>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  name="license" 
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleLicenseUpload}
                />
                
                <Button
                  variant="contained"
                  onClick={handleTriggerUpload}
                  startIcon={<Upload />}
                  sx={{ 
                    backgroundColor: '#1E5DA9',
                    '&:hover': {
                      backgroundColor: '#154281'
                    },
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem'
                  }}
                >
                  Select File
                </Button>
                
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    License Requirements:
                  </Typography>
                  <List dense sx={{ textAlign: 'left' }}>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="Clear image of your official medical license" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="All text must be readable" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="License number and expiration date visible" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Info color="info" /></ListItemIcon>
                      <ListItemText primary="No password protection on PDF files" />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            )}

            {verificationStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress 
                  variant={uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                  value={uploadProgress}
                  size={80}
                  thickness={4}
                  sx={{ 
                    color: '#1E5DA9', 
                    mb: 3,
                    '& circle': {
                      strokeLinecap: 'round'
                    }
                  }}
                />
                
                <Typography variant="h6" gutterBottom>
                  {uploadProgress < 100 ? 'Uploading License' : 'Verifying License'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {uploadProgress < 100 
                    ? 'Please wait while we upload your document...'
                    : 'Verifying with medical board registry...'}
                </Typography>
                
                {uploadProgress < 100 && (
                  <Box sx={{ width: '80%', mx: 'auto', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {uploadProgress}% uploaded
                    </Typography>
                  </Box>
                )}
                
                {licenseFile && (
                  <Chip
                    label={licenseFile.name}
                    icon={<Description />}
                    sx={{ 
                      mt: 3,
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }
                    }}
                  />
                )}
              </Box>
            )}

            {verificationStep === 3 && verificationStatus === 'verified' && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CheckCircle sx={{ 
                  fontSize: 80, 
                  color: 'success.main', 
                  mb: 2,
                  '& path': {
                    fillOpacity: 0.9
                  }
                }} />
                
                <Typography variant="h5" gutterBottom sx={{ color: 'success.main' }}>
                  Verification Successful!
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Your medical license has been verified and approved.
                </Typography>
                
                <Card variant="outlined" sx={{ textAlign: 'left', mb: 3 }}>
                  <CardContent sx={{ position: "relative" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      License Details:
                    </Typography>
                    <Typography variant="body2">
                      • File: {licenseFile?.name.substring(0, 20)}...
                    </Typography>
                    <Typography variant="body2">
                      • Verified on: {new Date().toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      • Status: <Chip label="Active" size="small" color="success" sx={{ ml: 1 }} />
                    </Typography>
                  </CardContent>
                </Card>
                
                <Alert severity="success" sx={{ textAlign: 'left' }}>
                  You can now proceed to sign up to your doctor account.
                </Alert>
              </Box>
            )}

            {verificationStep === 2 && verificationStatus === 'rejected' && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Cancel sx={{ 
                  fontSize: 80, 
                  color: 'error.main', 
                  mb: 2,
                  '& path': {
                    fillOpacity: 0.9
                  }
                }} />
                
                <Typography variant="h5" gutterBottom sx={{ color: 'error.main' }}>
                  Verification Failed
                </Typography>
                
                <Alert severity="error" sx={{ textAlign: 'left', mb: 3 }}>
                  We couldn't verify your medical license. Please check:
                </Alert>
                
                <List dense sx={{ textAlign: 'left', mb: 3 }}>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="The document is clear and all text is readable" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="License number and expiration date are visible" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="File is not password protected" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="error" /></ListItemIcon>
                    <ListItemText primary="Document matches your registration details" />
                  </ListItem>
                </List>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleRetryVerification}
                    startIcon={<CloudUpload />}
                    sx={{ 
                      backgroundColor: '#1E5DA9',
                      '&:hover': {
                        backgroundColor: '#154281'
                      }
                    }}
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => window.open('/help/license-verification', '_blank')}
                    startIcon={<Help />}
                  >
                    Get Help
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            borderTop: '1px solid #eee', 
            p: 2,
            justifyContent: verificationStatus === 'verified' ? 'space-between' : 'flex-end',
            backgroundColor: '#f9f9f9'
          }}>
            {verificationStatus === 'verified' && (
              <Button 
                startIcon={<CheckCircle color="success" />}
                sx={{ 
                  color: 'success.main',
                  '&:hover': {
                    backgroundColor: 'success.light'
                  }
                }}
              >
                Verified
              </Button>
            )}
            <Button 
              onClick={handleCloseVerificationDialog}
              sx={{ color: 'text.secondary' }}
            >
              Close
            </Button>
            {verificationStatus === 'verified' && (
              <Button 
                onClick={() => {
                  setVerificationDialogOpen(false);
                  setTimeout(() => {
                    document.querySelector('button[type="submit"]')?.focus();
                  }, 100);
                }}
                sx={{ 
                  color: '#1E5DA9',
                  fontWeight: 'bold'
                }}
              >
                Continue to Sign Up
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Grid container spacing={1.5}>
        <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    name="termsAccepted"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I accept the{' '}
                    <Link component={RouterLink} to="/terms" target="_blank" rel="noopener">
                      Terms and Conditions
                    </Link>
                  </Typography>
                }
              />
              {errors.termsAccepted && (
                <Typography variant="caption" color="error">
                  {errors.termsAccepted}
                </Typography>
              )}
            </Grid>
            </Grid>

        <Button
          type="submit"
          fullWidth
          disabled={verificationStatus !== "pending" || isSubmitting}
          sx={{
            mt: 3,
            py: 1.5,
            borderRadius: 2,
            background: "linear-gradient(135deg, #bee3fdff, #008cffff)",
            fontWeight: 700,
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ color: 'inherit', mr: 2 }} />
              Registering...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>

        <Grid container justifyContent="center" sx={{ mt: 1 }}>
          <Grid item>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/" variant="body2" sx={{ color: '#1E5DA9' }}>
                Login
              </Link>
            </Typography>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
            iconMapping={{
              info: <Info fontSize="inherit" />,
              success: <CheckCircle fontSize="inherit" />,
              warning: <Warning fontSize="inherit" />,
              error: <Error fontSize="inherit" /> 
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        </form>
        </Paper>
      </Grid>
      </Grid>
    </Box>
  );
}

export default DoctorSignUp;