import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box,Typography,TextField,Button,Grid,Link,FormControl,InputLabel,OutlinedInput,InputAdornment,
  IconButton,FormHelperText,Checkbox,FormControlLabel,CircularProgress,Alert,Snackbar,} from '@mui/material';
import { Visibility, VisibilityOff,Email,Lock,ArrowBack,CheckCircle,Warning,Error,Info} from '@mui/icons-material'; 
import bgImage from '../Dashboard/image/P.png';

const PatientSignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(async () => {
        try {
          const res = await axios.post('http://localhost:8000/patient/signin', formData);
          if (res.status === 200) {
            const { token, patient } = res.data;
          
            localStorage.setItem("patientName", `${patient.firstName} ${patient.lastName}`);
            localStorage.setItem("patientEmail", patient.email);
            localStorage.setItem("patientToken", token);
            localStorage.setItem("patientId", patient.patientId);

            if(res.status == 200) {
              showSnackbar('Sign in successful! Redirecting...', 'success');
            setTimeout(() => navigate('/patient/dashboard'), 1000); 
          }
          }
        } catch (err) {
          showSnackbar("Login failed: " + (err.response?.data?.message || err.message), "error");
          setIsSubmitting(false); 
        } finally {
          setIsSubmitting(false); 
        }
    }, 1500);
  }
};

const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
      <Box
        sx={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          width: "100%", 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
          position: "fixed",
          overflow: "hidden", 
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 600,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: 4,
            borderRadius: 3,
            boxShadow: 3,
            position: "fixed",
            zIndex: 2,
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
                  InputLabelProps={{ shrink: true }}
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
                    sx={{
                    '& .MuiInputBase-root': {
                      paddingTop: '20px', 
                      paddingBottom: '25px',
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
              disabled={isSubmitting}
              sx={{ 
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                  background: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
                  color: 'white',
                    '&:hover': {
                  background: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)"
                  },
                  '&.Mui-disabled': {
                color: 'text.disabled'
                }
              }}
            >
          {isSubmitting ? (
        <>
        <CircularProgress size={24} sx={{ color: 'inherit', mr: 2 }} />
          Signing In...
        </>
        ) : (
          'Sign In'
        )}
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
        </Box>
      </Box>
    );
    
};

export default PatientSignIn;