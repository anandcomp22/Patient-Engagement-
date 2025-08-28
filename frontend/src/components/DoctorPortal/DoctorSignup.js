import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Box, Typography, TextField, Button, Grid, IconButton,
  FormControl, InputLabel, OutlinedInput, InputAdornment, MenuItem, Select,
  Card, CardContent, Chip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, List, ListItem, ListItemIcon, ListItemText,
  LinearProgress, Alert, CircularProgress, FormHelperText, FormControlLabel,
  Checkbox, Snackbar, Link
} from "@mui/material";

import {
  Visibility, VisibilityOff, ArrowBack, Badge, CloudUpload, Upload,
  Description, Info, CheckCircle, VerifiedUser, Error, Cancel,
  Warning, Help, Person, Email, Phone, Work, School, LocalHospital,
  LocationOn, Lock
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

const [rememberMe, setRememberMe] = useState(false);
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
    licenseFile: null,
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

  const handleRememberMe = (event) => {
  setRememberMe(event.target.checked);
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

// Handle file upload
const handleLicenseUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    setLicenseFile(file);
    setUploadProgress(30); // fake progress step
    setTimeout(() => setUploadProgress(100), 1500); // simulate upload
    setTimeout(() => {
      setVerificationStatus("verified"); // simulate success
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
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (validate()) {
    try {
      setIsSubmitting(true);
      const { confirmPassword, ...doctorData } = formData;

      const response = await axios.post("http://localhost:8000/doctor/signup", doctorData);

      if (response.status === 201) {
        setSnackbarMessage("Doctor Registered Successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        navigate("/doctor/signin");
      }
    } catch (err) {
      setSnackbarMessage("Registration Failed: " + (err.response?.data?.message || "Unknown error"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }
};

  
  return (
    <Box sx={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 2,
            position: "absolute",
            overflow: "hidden",
          }}>
    <Card sx={{
      width: "100%",
      maxWidth: 800,
      maxHeight: "90vh",
      overflowY: "auto",
      borderRadius: 3,
      boxShadow: 6
    }}>
    <CardContent>
      <Typography
        variant="h5"
        align="center"
        sx={{ fontWeight: "bold", mb: 2 }}
      >
        Doctor Registration
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Medical License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.specialty}>
              <InputLabel>Specialty</InputLabel>
              <Select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                label="Specialty"
                startAdornment={
                  <InputAdornment position="start">
                    <Work color="action" />
                  </InputAdornment>
                }
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.qualifications}>
              <InputLabel>Qualifications</InputLabel>
              <Select
                multiple
                name="qualifications"
                value={formData.qualifications}
                onChange={handleQualificationChange}
                label="Qualifications"
                renderValue={(selected) => selected.join(', ')}
                startAdornment={
                  <InputAdornment position="start">
                    <School color="action" />
                  </InputAdornment>
                }
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Years of Experience"
              name="experience"
              type="number"
              value={formData.experience}
              onChange={handleChange}
              error={!!errors.experience}
              helperText={errors.experience}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Work color="action" />
                  </InputAdornment>
                ),
                inputProps: { min: 0, max: 60 }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hospital/Clinic Name"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              error={!!errors.hospital}
              helperText={errors.hospital}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalHospital color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={!!errors.country}>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                label="Country"
                startAdornment={
                  <InputAdornment position="start">
                    <LocationOn color="action" />
                  </InputAdornment>
                }
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
            <FormControl fullWidth error={!!errors.state}>
              <InputLabel>State</InputLabel>
              <Select
                name="state"
                value={formData.state}
                onChange={handleChange}
                label="State"
                disabled={!formData.country}
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
            <FormControl fullWidth error={!!errors.district}>
              <InputLabel>District</InputLabel>
              <Select
                name="district"
                value={formData.district}
                onChange={handleChange}
                label="District"
                disabled={!formData.state}
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
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" error={!!errors.password}>
              <InputLabel>Password</InputLabel>
              <OutlinedInput
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                startAdornment={
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
                />
                {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
              </FormControl>
            </Grid>
  
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" error={!!errors.confirmPassword}>
                <InputLabel>Confirm Password</InputLabel>
                <OutlinedInput
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Confirm Password"
                />
                {errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
              </FormControl>
            </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mt: 1
        }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe} 
                onChange={handleRememberMe} 
                color="primary" 
              />
            }
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

        <Card variant="outlined" sx={{ mt: 3, mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Badge color="primary" sx={{ mr: 1 }} />
              License Verification
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
                   'Medical license verification required for sign up'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setVerificationDialogOpen(true)}
                sx={{ 
                  color: '#1E5DA9', 
                  borderColor: '#1E5DA9',
                  whiteSpace: 'nowrap'
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
          </CardContent>
        </Card>

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
                  <CardContent>
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
                    <Link href="#" target="_blank" rel="noopener">
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={verificationStatus !== 'verified' || isSubmitting}
          sx={{ 
            mt: 2,
            mb: 2,
            py: 1.5,
            fontSize: '1rem',
            background: verificationStatus !== 'verified' 
              ? 'action.disabledBackground' 
              : "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
            color: verificationStatus !== 'verified' ? 'text.secondary' : 'white',
            '&:hover': {
              background: verificationStatus !== 'verified' 
                ? 'action.disabledBackground' 
                : "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)"
            },
            '&.Mui-disabled': {
              color: 'text.disabled'
            }
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
              <Link href="/doctor/signin" variant="body2" sx={{ color: '#1E5DA9' }}>
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
        </Box>
    </CardContent>
  </Card>
    </Box>
  );
};

export default DoctorSignUp;