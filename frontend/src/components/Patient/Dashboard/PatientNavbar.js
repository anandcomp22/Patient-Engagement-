import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, Button, TextField, IconButton, Avatar } from "@mui/material";
import { Notifications, Settings, Menu as MenuIcon } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
//import "./PatientNavbar.css";

const PatientNavbar = ({ sidebarOpen, onToggle, isMobile }) => {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("patientName");
    const email = localStorage.getItem("patientEmail");
    if (name && email) {
      setPatientName(name);
      setPatientEmail(email);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("patientName");
    localStorage.removeItem("patientEmail");
    navigate("/");
  };

  return (
    <AppBar
        position="fixed"
        sx={{
          width: isMobile ? "100%" : (sidebarOpen ? "calc(100% - 240px)" : "calc(100% - 62px)"),
          ml: isMobile ? 0 : (sidebarOpen ? "240px" : "62px"),
          transition: "all 0.3s ease-in-out",
          bgcolor: "background.paper",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.05)", 
          border: "none",                            
          borderRadius: "0px 0px 20px 20px",         
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
      <Toolbar sx={{ display: "flex", alignItems: "center", px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Hamburger menu for mobile */}
        {isMobile && (
          <IconButton
            onClick={onToggle}
            sx={{ color: "#1E5DA9", mr: 1 }}
            aria-label="open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Search Box — hidden on mobile */}
        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search doctors, appointments..."
            size="small"
            fullWidth
            sx={{
              width: { sm: 200, md: 250 },
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
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1, md: 2 } }}>
          <IconButton sx={{ color: "gray" }}>
            <Notifications />
          </IconButton>
          <IconButton sx={{ color: "gray", display: { xs: "none", sm: "inline-flex" } }}>
            <Settings />
          </IconButton>
          <Avatar sx={{ backgroundImage: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)", width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
            {patientName.charAt(0) || "P"}
          </Avatar>
          {/* Hide name/email on mobile */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="subtitle2" color="text.primary">
              {patientName || "Patient Name"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {patientEmail || "patient@example.com"}
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
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": {
                backgroundColor: "#f0f7ff",
                borderColor: "#1E5DA9"
              }
            }}
          >
            Logout
          </Button>
          {/* Mobile logout — icon only */}
          <IconButton
            onClick={handleLogout}
            sx={{ color: "#1E5DA9", display: { xs: "inline-flex", sm: "none" } }}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PatientNavbar;
