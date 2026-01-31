import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import backgroundImage from '../Dashboard/image/D.png';
import { 
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link, 
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  MenuItem,
  Select, Card, CardContent
} from '@mui/material';
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { 
  Visibility, 
  VisibilityOff,
  Person,
  Email,
  Phone,
  Lock,
  ArrowBack,
  LocationOn
} from '@mui/icons-material';

const countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
const statesByCountry = {
  'India': ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi'],
  'United States': ['California', 'Texas', 'New York', 'Florida', 'Illinois'],
};
const districtsByState = {
  'Karnataka': ['Bangalore Urban', 'Mysore', 'Belgaum', 'Mangalore'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
};

const PatientSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    country: '',
    state: '',
    district: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 1 || age > 120) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const res = await axios.post("http://localhost:8000/patient/signup", formData);
  
        if (res.status === 201) {
          alert("Patient Registered Successfully");
          navigate("/patient/signin");
        }
      } catch (err) {
        alert("Registration Failed: " + err.response?.data?.message);
      }
    }
  };
  

  return (
    <Box
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: 2,
          overflowY: "auto" 
            }}
      >
        <Card sx={{
              width: "100%",
              maxWidth: 650,
              borderRadius: 3,
              boxShadow: 6
            }}>
            <CardContent>
    <Container maxWidth="sm" sx={{ mt: 6, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          Create Patient Account
        </Typography>
      </Box>
      
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
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                      <Person color="action" />
                    </Box>
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
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                      <Person color="action" />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                      <Email color="action" />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                      <Phone color="action" />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              error={!!errors.dob}
              helperText={errors.dob}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                      <CalendarMonthIcon color="action" />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.country}>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={formData.country}
                onChange={handleChange}
                label="Country"
                sx={{
                  '& .MuiSelect-select': {
                    paddingTop: '24px',
                    paddingBottom: '8px',
                  },
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 1 }}>
                      <LocationOn color="action" />
                    </Box>
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.state}>
              <InputLabel>State</InputLabel>
              <Select
                name="state"
                value={formData.state}
                onChange={handleChange}
                label="State"
                disabled={!formData.country}
                sx={{
                  '& .MuiSelect-select': {
                    paddingTop: '24px',
                    paddingBottom: '8px',
                  },
                }}
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.district}>
              <InputLabel>District</InputLabel>
              <Select
                name="district"
                value={formData.district}
                onChange={handleChange}
                label="District"
                disabled={!formData.state}
                sx={{
                  '& .MuiSelect-select': {
                    paddingTop: '24px',
                    paddingBottom: '8px',
                  },
                }}
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
                sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
                startAdornment={
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 1 }}>
                      <Lock color="action" />
                    </Box>
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 1 }}>
                      <Lock color="action" />
                    </Box>
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
                sx={{
                '& .MuiInputBase-root': {
                  paddingTop: '6px',
                },
              }}
                startAdornment={
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 1 }}>
                      <Lock color="action" />
                    </Box>
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 1 }}>
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
                label="Confirm Password"
              />
              {errors.confirmPassword && <FormHelperText>{errors.confirmPassword}</FormHelperText>}
            </FormControl>
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ 
            mt: 3, 
            mb: 2,
            py: 1.5,
            backgroundColor: '#1E5DA9',
            '&:hover': {
              backgroundColor: '#154281'
            }
          }}
        >
          Sign Up
        </Button>
        
        <Grid container justifyContent="flex-end">
          <Grid item>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/patient/signin" variant="body2" sx={{ color: '#1E5DA9' }}>
                Sign in
              </Link>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
    </CardContent>
    </Card>
    </Box>
  );
};

export default PatientSignUp;