import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar,
  Typography, Box,
  Button, TextField,
  IconButton, Avatar
} from "@mui/material";
import { Notifications, Settings } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
//import "./Navbar.css";


const Navbar = ({ sidebarOpen }) => {
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("doctorName");
    const email = localStorage.getItem("doctorEmail");
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
    <AppBar
        position="fixed"
        sx={{
          width: sidebarOpen ? "calc(100% - 250px)" : "calc(100% - 62px)",
          ml: sidebarOpen ? "220px" : "62px",
          transition: "all 0.3s ease-in-out",
          bgcolor: "background.paper",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.05)", 
          border: "none",                            
          borderRadius: "0px 0px 20px 20px",         
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
      <Toolbar sx={{ display: "flex", alignItems: "center", px: 3 }}>
        {/* Search Box */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search..."
            size="small"
            fullWidth
            sx={{
              width: 250,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "grey.100",
                "& fieldset": { border: "none" }
              }
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton sx={{ color: "gray" }}>
            <Notifications />
          </IconButton>
          <IconButton sx={{ color: "gray" }}>
            <Settings />
          </IconButton>
          <Avatar sx={{ backgroundImage: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)" }}>
            {doctorName.charAt(0) || "D"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" color="text.primary">
              {doctorName || "Doctor Name"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {doctorEmail || "doctor@example.com"}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              color: "#1E5DA9",
              borderColor: "#1E5DA9",
              px: 1.5,
              "&:hover": {
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
