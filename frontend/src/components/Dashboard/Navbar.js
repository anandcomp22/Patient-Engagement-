import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, TextField } from "@mui/material";
import "./Navbar.css"; // Make sure to import the updated CSS file

const Navbar = () => {
  return (
    <AppBar position="fixed" className="navbar" sx={{ width: "calc(100% - 240px)", ml: "250px" }}>
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
                "& fieldset": { border: "none" }, // Removes border
              },
            }}
          />
        </Box>

        {/* Right Section - User Info & Logout */}
        <Box className="navbar-actions">
          <Typography className="user-info">Dr. Edward Jenner</Typography>
          <Button variant="contained" className="logout-btn">
            Logout
          </Button>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
