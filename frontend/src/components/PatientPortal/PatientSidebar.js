import React from "react";
import { Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from "@mui/material";
import {
  Dashboard,
  CalendarMonth,
  VideoCall,
  Help,
  ExitToApp
} from '@mui/icons-material';
import logo from "./image/licons.png";

const PatientSidebar = () => {
  return (
    <Drawer variant="permanent" className="sidebar">
      {/* AidME Title Section */}
      <Box className="sidebar-header" sx={{ gap: 1 }}>
        <img src={logo} alt="AidME logo" width="30px"/>
        <Typography variant="h6" className="sidebar-title">
          AidME
        </Typography>
      </Box>

      {/* Menu List */}
      <List className="sidebar-menu">
        <ListItem button component={Link} to="/patient/dashboard">
          <ListItemIcon><Dashboard sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Dashboard" sx={{ color: "white" }} />
        </ListItem>
        
        <ListItem button component={Link} to="/patient/appointments">
          <ListItemIcon><CalendarMonth sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Appointments" sx={{ color: "white" }} />
        </ListItem>
        
        <ListItem button component={Link} to="/patient/video-call">
          <ListItemIcon><VideoCall sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Video Call Room" sx={{ color: "white" }} />
        </ListItem>

        <Box className="sidebar-divider"></Box>

        <ListItem button component={Link} to="/patient/help">
          <ListItemIcon><Help sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Help & Support" sx={{ color: "white" }} />
        </ListItem>
        
        <ListItem button component={Link} to="/">
          <ListItemIcon><ExitToApp sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: "white" }} />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default PatientSidebar;