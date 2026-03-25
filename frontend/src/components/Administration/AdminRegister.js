import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  CircularProgress,
  Link,
  Chip,
  Snackbar,
  Alert
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ShieldOutlined,
  Security
} from "@mui/icons-material";

import { API_BASE } from "../../apiConfig";

const API = API_BASE;

const AdminSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "", 
    password: "",
    confirmPassword: "",
    role: "",
    terms: false
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.terms) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Please accept Terms & Conditions");
      setSnackbarOpen(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Passwords do not match");
      setSnackbarOpen(true);
      return;
    }
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/admin/auth/register`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        dob: formData.dob,
        password: formData.password.trim(),
        role: formData.role.toLowerCase() || "admin"
      });

      setSnackbarSeverity("success");
      setSnackbarMessage(
        "Admin registered successfully. Please login to continue."
      );
      setSnackbarOpen(true);


      setTimeout(() => {
        navigate("/admin/auth/login");
      }, 1000);
    } catch (err) {
      setSnackbarSeverity("error");
      setSnackbarMessage(
        err.response?.data?.message || "Registration failed"
      );
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
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
  };

  return (
    <Box 
      sx={{
      minHeight: "100vh",
      px: { xs: 2, md: 10 },
      display: "flex",
      alignItems: "center",
      width: "100%",
      background:
      "radial-gradient(circle at top, #eef6ff 0%, #ffffff 60%)",
    }}
    >
      < Grid container spacing={8} alignItems="center">
        {/* LEFT CONTENT */}
        <Grid item xs={12} md={4}>
          <Chip
            icon={<Security />}
            label="Admin Access Only"
            sx={{
              mb: 3,
              px: 2,
              py: 1,
              borderRadius: 3,
              bgcolor: "#ffffff",
              fontWeight: 600,
              boxShadow: 2
            }}
            />
          <Typography variant="h3" fontWeight="800" color="#0b428f" lineHeight={1.2}>
            Healthcare
            <br />
            Control
            <br />
            Center
          </Typography>
          <Typography variant="body1" sx ={{ mt: 3, color: "#5f6f86", maxWidth: 520,fontSize: "1.05rem", lineHeight: 1.7}}>
            Securely manage doctors, patients, appointments, and system operations from one centralized admin dashboard.
          </Typography>

          <Box sx={{ display: "flex", gap: 4, mt: 6 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#2d79d6">
                100%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure Access
              </Typography>
            </Box>
          
            <Box>
              <Typography variant="h4" fontWeight={800} color="#2d79d6">
                24/7
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitoring
              </Typography>
            </Box>
          
            <Box>
              <Typography variant="h4" fontWeight={800} color="#2d79d6">
                Full
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control
              </Typography>
            </Box>
          </Box>
        </Grid>

      {/* RIGHT FORM CARD */}
      <Grid item xs={12} md={7}>
        <Paper elevation={6}
        sx={{
          p:4,
          borderRadius: 4,
          maxWidth: 560,
          width: "100%",
          mx: "auto",
          background: "linear-gradient(135deg, #f4f9ff, #ffffff)",
          boxShadow: "0 20px 60px rgba(13,110,253,0.15)",
        }}
        >
          {/* ADMIN REGISTER FORM */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", mb: 4, gap: 2, justifyContent: 'space-between', alignItems: 'center', px: 8}}>
              <Button
              variant="contained"
              fullWidth
              sx={{
                borderRadius: 2,
              }}
              onClick={() => navigate("/admin/auth/register")}
              >
              Admin Register 
              </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={600}>First Name</Typography>
              <TextField
                fullWidth
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                sx={inputStyle}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" fontWeight={600}>Last Name</Typography>
              <TextField
                fullWidth
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                sx={inputStyle}
              />
            </Grid>
          </Grid>

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Admin Email</Typography>
            <TextField
              fullWidth
              name="email"
              placeholder="Admin Email"
              value={formData.email}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Contact Number</Typography>
            <TextField
              fullWidth
              name="phone"
              placeholder="Contact Number"
              value={formData.phone}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Role</Typography>
            <FormControl fullWidth sx={inputStyle}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Date of Birth</Typography>
            <TextField
              fullWidth
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              sx={inputStyle}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Password</Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              sx={inputStyle}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight={600}>Confirm Password</Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              sx={inputStyle}
            />
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox name="terms" onChange={handleChange} />}
            label="I agree to the Terms and Conditions"
          />
        </Grid>
        
        <Button
          fullWidth
          type="submit"
          size="large"
          variant="contained"
          disabled={isSubmitting}
          sx={{
            mt: 2,
            borderRadius: 2
          }}
          >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
            ) : (
            "SIGN UP ADMIN"
          )}
          </Button>
        
          <Typography 
            variant="body2"
            sx={{ mt: 1.5, textAlign: "center", color: "text.secondary" }}
            >
              Already have an account?{" "}
            <Box
              component="span"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick ={() => 
                navigate("/admin/auth/login")
              }
              >SignIn as Admin</Box>
            </Typography>

            <Snackbar
              open={snackbarOpen}
              autoHideDuration={4000}
              onClose={() => setSnackbarOpen(false)}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert severity={snackbarSeverity}>
                {snackbarMessage}
              </Alert>
            </Snackbar>
            </form>
        </Paper>
        </Grid>
      </Grid>
    </Box>

  );
};

export default AdminSignUp;

