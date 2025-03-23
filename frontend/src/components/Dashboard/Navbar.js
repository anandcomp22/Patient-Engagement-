import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, TextField, IconButton, Avatar} from "@mui/material";
import { Notifications, Settings, SupervisedUserCircleRounded } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import "./Navbar.css";

const Navbar = () => {
  return (
    <AppBar position="fixed" className="navbar" sx={{ width: "calc(100% - 280px)", ml: "280px" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        
        {/* Left Section - Logo & Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search Bar */}
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

        {/* Right Section - User Info & Logout */}
        <Box className="navbar-actions" sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Notification & Settings Icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton classname="navicon" color="primary" sx={{color: "gray"}}>
            <Notifications />
          </IconButton>
          <IconButton classname="navicon" color="primary" sx={{color: "gray"}}>
            <Settings />
          </IconButton>
          </Box>
            <Avatar sx={{size: "10px"}}>P</Avatar>
            <Typography variant="body1" className="user-info" sx={{ marginLeft: "-10px" }}>
              Dr. Prathap C. Reddy <div className="user-email">prathap.reddy@MedConnect.com</div>
            </Typography>
            <Button variant="contained" className="logout-btn" startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
