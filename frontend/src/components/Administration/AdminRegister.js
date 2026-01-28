import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  Button, InputAdornment, IconButton, FormControl,
  OutlinedInput, InputLabel, FormHelperText,
  Checkbox, FormControlLabel, Snackbar, Alert, CircularProgress, Link
} from "@mui/material";
import {
  Person, Email, Phone, Lock,
  Visibility, VisibilityOff, AdminPanelSettings,
  CheckCircle, Error, ArrowBack
} from "@mui/icons-material";
//import bgImage from "./img/P.png";

const AdminSignUp = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "Accept terms & conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        "http://localhost:8000/admin/auth/register",
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: "admin"
          }
      );

      if (res.status === 201) {
        setSnackbarMessage("Admin Registered Successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        navigate("/admin/auth/login");
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
        //backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
        position: "fixed",
        overflowY: "auto"
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 520, borderRadius: 3, boxShadow: 6 }}>
        <CardContent sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Admin Registration
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={1.5}>
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
                        <Person />
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
                          <Person />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
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
                          <Email />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
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
                          <Phone />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.password}>
                  <InputLabel>Password</InputLabel>
                  <OutlinedInput
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    sx={{
                    '& .MuiInputBase-root': {
                      paddingTop: '6px',
                    },
                  }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                          <Lock />
                        </Box>
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        </Box>
                      </InputAdornment>
                    }
                    label="Password"
                  />
                  <FormHelperText>{errors.password}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.confirmPassword}>
                  <InputLabel>Confirm Password</InputLabel>
                  <OutlinedInput
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                        <Lock />
                        </Box>
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.8 }}>
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
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
                  <FormHelperText>{errors.confirmPassword}</FormHelperText>
                </FormControl>
              </Grid>
            </Grid>

            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  name="termsAccepted"
                />
              }
              label={
                <Typography variant="body2">
                  I accept the <Link href="#">Terms & Conditions</Link>
                </Typography>
              }
            />
            {errors.termsAccepted && (
              <Typography variant="caption" color="error">
                {errors.termsAccepted}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting} 
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: "1rem",
                background: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={22} sx={{ mr: 1, color: "white" }} />
                  Registering...
                </>
              ) : (
                "Register Admin"
              )}
            </Button>

            <Typography align="center" mt={2} variant="body2">
              Already have Account?{" "}
              <Link href="/admin/login" sx={{ color: "#1E5DA9" }}>
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={snackbarSeverity}
          icon={
            snackbarSeverity === "success" ? <CheckCircle /> : <Error />
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSignUp;
