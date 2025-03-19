import React from "react";
import { Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from "@mui/material";
import { Dashboard, CalendarMonth, People, Medication, VideoCall, Analytics, Settings, Help } from "@mui/icons-material";
import logo from "./icons/licons.png"
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <Drawer variant="permanent" className="sidebar">
      {/* MedConnect AI Title Section */}
      <Box className="sidebar-header" sx={{gap:1}}>
        <img src={logo} alt="DR. logo" width="30px"/>
        <Typography variant="h6" className="sidebar-title">
        MedConnect AI
        </Typography>
      </Box>

      {/* Menu List */}
      <List className="sidebar-menu">
        <ListItem button component={Link} to="/">
          <ListItemIcon><Dashboard sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Dashboard" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/Appointments">
          <ListItemIcon><CalendarMonth sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Appointments" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/patients">
          <ListItemIcon><People sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Patients" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/">
          <ListItemIcon><Medication sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Prescriptions" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/LiveVideoCall">
          <ListItemIcon><VideoCall sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Video Calls" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/">
          <ListItemIcon><Analytics sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Analytics" sx={{ color: "white" }} />
        </ListItem>

        <Box className="sidebar-divider"></Box>

        <ListItem button component={Link} to="/">
          <ListItemIcon><Settings sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Settings" sx={{ color: "white" }} />
        </ListItem>
        <ListItem button component={Link} to="/">
          <ListItemIcon><Help sx={{ color: "white" }} /></ListItemIcon>
          <ListItemText primary="Help & Support" sx={{ color: "white" }} />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
