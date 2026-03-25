import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton, 
  InputAdornment,
  CircularProgress,
  Grid,
  Chip,
  Paper,
  FormControlLabel,
  Checkbox,
  Link,
  Snackbar
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff, ArrowBack, AdminPanelSettings, Security } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
//import backgroundImage from "../assets/admin-bg.jpg";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("admin");
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [formData, setFormData] = useState({
        email: '',
        password: ''
      });


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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await axios.post(
        `${API}/admin/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        }
      );

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem(
        "adminName",
        `${res.data.admin.firstName} ${res.data.admin.lastName}`
      );
      localStorage.setItem("adminEmail", res.data.admin.email);

      setSnackbarSeverity("success");
      setSnackbarMessage("Login successful");
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 800);

    } catch (err) {
      setSnackbarSeverity("error");
      setSnackbarMessage(
        err.response?.data?.message || "Invalid credentials"
      );
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box 
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
            icon={<Security />}
            label="Admin Access Only"
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
            sx={{
              color: "#0b428f",
              lineHeight: 1.1,
            }}
          >
            Healthcare
            <br />
            Control
            <br />
            Center
          </Typography>

          <Typography
          variant="body1"
            sx={{
              mt: 3,
              color: "#5f6f86",
              maxWidth: 520,
              fontSize: "1.05rem",
              lineHeight: 1.7,
            }}
          >
            Securely manage doctors, patients, appointments, and system
            operations from one centralized admin dashboard. Full control,
            real-time insights, and complete data visibility.
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

        {/* RIGHT LOGIN CARD */}
        <Grid item xs={12} md={5}>
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

            {/* ADMIN LOGIN */}
            <form onSubmit={handleLogin}>
              <Box sx={{ display: "flex", mb: 3, gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  variant={loginType === "admin" ? "contained" : "contained"}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                  }}
                  onClick={() => navigate("/")}
                >
                  HOME 
                </Button>

                <Button
                  variant={loginType === "admin" ? "contained" : "contained"}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                  }}
                  onClick={() => setLoginType("admin")}
                >
                  ADMIN LOGIN
                </Button>
              </Box>

            <Typography variant="body2" fontWeight={600} mb={0.5}>
              Admin ID / Email
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter Admin ID or Email"
              variant="outlined"
              type="email"
              name="email"
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

            <Typography variant="body2" fontWeight={600}>
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

            <Box sx={{ display: "flex", justifyContent: 'space-between', alignItems: 'center', mb: 0}}>
              <FormControlLabel
                control={<Checkbox checked={rememberMe} onChange={handleRememberMe}/>}
                label="Remember me"
              />
              <Link href="/admin/auth/forgot-password" variant="body2" sx={{ color: '#1E5DA9', cursor: 'pointer' }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              fullWidth
              type="submit"
              size="large"
              variant="contained"
              display={isSubmitting}
              sx={{
                mt: 2,
                borderRadius: 2
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
              ) : (
                "SIGN IN ADMIN"
              )}
            </Button>

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
              onClick ={() => 
                navigate("/admin/auth/register")
              }
              >Register as Admin</Box>
            </Typography>

            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={() => setSnackbarOpen(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }} >
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

export default AdminLogin;
