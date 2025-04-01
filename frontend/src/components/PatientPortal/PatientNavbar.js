import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, TextField, IconButton, Avatar } from "@mui/material";
import { Notifications, Settings } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";

const PatientNavbar = () => {
  return (
    <AppBar position="fixed" className="navbar" sx={{ 
      width: "calc(100% - 280px)", 
      ml: "280px",
      backgroundColor: "#ffffff",
      color: "#333333",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <Toolbar sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        width: "100%",
        padding: "0 24px"
      }}>
        
        {/* Left Section - Search Bar */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            variant="outlined"
            placeholder="Search doctors, appointments..."
            size="small"
            className="search-bar"
            sx={{
              width: "350px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { border: "none" },
              },
            }}
          />
        </Box>

        {/* Right Section - User Info & Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Notification & Settings Icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton className="navicon" sx={{ color: "#555555" }}>
              <Notifications />
            </IconButton>
            <IconButton className="navicon" sx={{ color: "#555555" }}>
              <Settings />
            </IconButton>
          </Box>
          
          {/* User Profile */}
          <Box sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1,
            padding: "8px 12px",
            borderRadius: "4px",
            '&:hover': {
              backgroundColor: "#f5f5f5"
            }
          }}>
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: "#1E5DA9",
              fontSize: "14px"
            }}>
              JS
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="body1" sx={{ 
                fontSize: "14px",
                fontWeight: "500",
                lineHeight: "1.2"
              }}>
                Shri Hari Prasad Sharma
              </Typography>
              <Typography variant="body2" sx={{ 
                fontSize: "12px",
                color: "#666666"
              }}>
                 prasad.sharma@example.com
              </Typography>
            </Box>
          </Box>
          
          {/* Logout Button */}
          <Button 
            variant="outlined" 
            className="logout-btn" 
            startIcon={<LogoutIcon sx={{ fontSize: "18px" }} />}
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

export default PatientNavbar;