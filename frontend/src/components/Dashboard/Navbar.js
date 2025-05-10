import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Avatar
} from "@mui/material";
import { Notifications, Settings } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import "./Navbar.css";

const Navbar = () => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("doctorName");
    const email = localStorage.getItem("doctorEmail");
    console.log("Navbar doctorName:", name);
    console.log("Navbar doctorEmail:", email);
    if (name && email) {
      setDoctorName(name);
      setDoctorEmail(email);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("doctorName");
    localStorage.removeItem("doctorEmail");
    navigate("/doctor/signin");
  };


  return (
    <AppBar position="fixed" className="navbar" sx={{ width: "calc(100% - 280px)", ml: "280px" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        
        {/* Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TextField
            variant="outlined"
            placeholder="Search..."
            size="small"
            className="search-bar"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { border: "none" },
              },
            }}
          />
        </Box>

        {/* Right Section */}
        <Box className="navbar-actions" sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <IconButton color="primary" sx={{ color: "gray" }}>
            <Notifications />
          </IconButton>
          <IconButton color="primary" sx={{ color: "gray" }}>
            <Settings />
          </IconButton>

          <Avatar>{doctorName ? doctorName.charAt(0) : "D"}</Avatar>
          <Typography variant="body1" className="user-info" sx={{ marginLeft: "-10px" }}>
            {doctorName || "Doctor Name"}
            <div className="user-email">{doctorEmail || "doctor@example.com"}</div>
          </Typography>

          <Button
            variant="outlined"
            className="logout-btn"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              color: "#1E5DA9",
              borderColor: "#1E5DA9",
              padding: "6px 12px",
              '&:hover': {
                backgroundColor: "#f0f7ff",
                borderColor: "#1E5DA9"
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
