import React from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import "./Navbar.css";

const Navbar = () => {
  return (
    <AppBar position="fixed" className="navbar">
      <Toolbar>
        <Typography variant="h6" className="navbar-title">
          MedConnect AI
        </Typography>
        <Box className="navbar-actions">
          <Typography className="user-info">Dr. Sarah Williams</Typography>
          <Button variant="contained" className="logout-btn">
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
