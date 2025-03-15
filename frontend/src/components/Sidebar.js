import React from "react";
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { Dashboard, CalendarMonth, People, Medication, VideoCall, Analytics, Settings, Help } from "@mui/icons-material";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <Drawer variant="permanent" className="sidebar">
      <List>
        <ListItem button>
          <ListItemIcon><Dashboard /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><CalendarMonth /></ListItemIcon>
          <ListItemText primary="Appointments" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><People /></ListItemIcon>
          <ListItemText primary="Patients" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><Medication /></ListItemIcon>
          <ListItemText primary="Prescriptions" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><VideoCall /></ListItemIcon>
          <ListItemText primary="Video Calls" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><Analytics /></ListItemIcon>
          <ListItemText primary="Analytics" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><Settings /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><Help /></ListItemIcon>
          <ListItemText primary="Help & Support" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
