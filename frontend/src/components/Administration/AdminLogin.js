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
  Link
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff, ArrowBack, AdminPanelSettings } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
//import backgroundImage from "../assets/admin-bg.jpg";

const API = process.env.REACT_APP_API_URL;

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/admin/auth/login`, {
        email,
        password
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminName", `${res.data.admin.firstName} ${res.data.admin.lastName}`);
      localStorage.setItem("adminEmail", res.data.admin.email);
      navigate("/admin/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        //backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 500,
          backgroundColor: "rgba(255,255,255,0.95)",
          p: 4,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="bold">
            Admin Login
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleLogin}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                    '& .MuiInputBase-root': {
                      paddingTop: '6px', 
                    },
                  }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, mt: 0.2 }}>
                        <Lock />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2,
              mb: 2,
              py: 1.5,
              fontSize: "1rem",
              background: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={22} sx={{ color: "white", mr: 1 }} />
                Logging in...
              </>
            ) : (
              "Login as Admin"
            )}
          </Button>

          <Grid container justifyContent="center" sx={{ mt: 1 }}>
          <Grid item>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/admin/register" variant="body2" sx={{ color: '#1E5DA9' }}>
                Register as Administrator
              </Link>
            </Typography>
          </Grid>
        </Grid>

        </Box>
      </Box>
    </Box>
  );
};

export default AdminLogin;
