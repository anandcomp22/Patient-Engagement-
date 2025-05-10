import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
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
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Email,
  Lock,
  ArrowBack
} from '@mui/icons-material';
import bgImage from './image/P.png';

const PatientSignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const res = await axios.post('http://localhost:8000/patient/signin', formData);
        if (res.status === 200) {
          const { token, patient } = res.data;
        
          localStorage.setItem("token", token);
          localStorage.setItem("patientName", `${patient.firstName} ${patient.lastName}`);
          localStorage.setItem("patientEmail", patient.email);
        
          alert("Login successful");
          navigate('/patient/dashboard');
        }
        
      } catch (err) {
        alert("Login failed: " + err.response?.data?.message || err.message);
      }
    }
  };

  return (
      <Box
        sx={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: 4,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Patient Sign In
            </Typography>
          </Box>
    
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
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
            </Grid>
    
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 1,
              }}
            >
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
                href="/patient/forgot-password"
                variant="body2"
                sx={{ color: '#1E5DA9' }}
              >
                Forgot password?
              </Link>
            </Box>
    
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
                  backgroundColor: '#154281',
                },
              }}
            >
              Sign In
            </Button>
    
            <Grid container justifyContent="center">
              <Grid item>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link href="/patient/signup" variant="body2" sx={{ color: '#1E5DA9' }}>
                    Sign up
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    );
    
};

export default PatientSignIn;