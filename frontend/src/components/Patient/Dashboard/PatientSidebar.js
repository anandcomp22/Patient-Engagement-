import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box, Tooltip } from "@mui/material";
import {
  Dashboard,
  CalendarMonth,
  VideoCall,
  Help,
  Menu as MenuIcon,
  LoginOutlined,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import DescriptionIcon from "@mui/icons-material/Description";
import Aidme from "../../Doctor/Dashboard/icons/logo.png";

const PatientSidebar = ({ open, onToggle }) => {
  const { pathname } = useLocation();

  const menuItems = [
      { text: "Dashboard", icon: <Dashboard />, to: "/patient/dashboard" },
      { text: "Appointments", icon: <CalendarMonth />, to: "/patient/appointments" },
      { text: "Video Call Room", icon: <VideoCall />, to: "/patient/video-call" },
      { text: "Upload Report", icon: <DescriptionIcon />, to: "/patient/upload-report" },
    ];

    const footerItems = [
        { text: "Help & Support", icon: <Help />, to: "/patient/support" },
        { text: "Logout", icon: <LoginOutlined />, to: "/" },
      ];

  return (
    <Drawer
          variant="permanent"
          className="sidebar"
          open={open}
          PaperProps={{
            sx: {
              width: open ? 240 : 62,
              transition: "width 0.3s ease-in-out",
              bgcolor: "primary.light",
              backgroundImage: open
                ? "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)"
                : "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
              color: "white",
              boxShadow: 3,
              overflowX: "hidden",
              borderTopRightRadius: 30,
              borderBottomRightRadius: 30,
            },
          }}
        >

        {/* Toggle Button */}
          <Box
            sx={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-end" : "center",
            px: 1,
          }}
        >
      <IconButton
          onClick={onToggle}
          sx={{
            bgcolor: "white",
            color: "primary.main",
            "&:hover": {
              bgcolor: "#e0f2ff",
            },
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <img
          src={Aidme}
          alt="AidME Logo"
          style={{
            maxWidth: open ? 120 : 40,
            transition: "max-width 0.3s ease",
          }}
        />
      </Box>

      {/* Main Menu */}
      <List>
        {menuItems.map((item) => (
          <Tooltip title={!open ? item.text : ""} placement="right" key={item.text}>
            <ListItem
              button
              component={Link}
              to={item.to}
              sx={{
                mb: 1,
                px: open ? 2 : 1,
                "& .MuiListItemIcon-root": {
                  color: "white",
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                },
                "& .MuiListItemText-root .MuiTypography-root": {
                  color: "white",
                  opacity: open ? 1 : 0,
                  transition: "opacity 0.3s",
                  whiteSpace: "nowrap",
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.2)",
                  "& .MuiListItemText-root .MuiTypography-root": {
                    color: "#0d47a1",
                  },
                },
                ...(pathname === item.to && {
                  bgcolor: "rgba(255,255,255,0.3)",
                }),
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </Tooltip>
        ))}
      </List>

      {/* Divider */}
      <Box sx={{ borderTop: "3px solid rgba(255,255,255,0.3)", my: 4 }} />

      {/* Footer Items */}
      <List>
        {footerItems.map((item) => (
          <Tooltip title={!open ? item.text : ""} placement="right" key={item.text}>
            <ListItem
              button
              component={Link}
              to={item.to}
              sx={{
                mb: 1,
                px: open ? 2 : 1,
                "& .MuiListItemIcon-root": {
                  color: "white",
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                },
                "& .MuiListItemText-root .MuiTypography-root": {
                  color: "white",
                  opacity: open ? 1 : 0,
                  transition: "opacity 0.3s",
                  whiteSpace: "nowrap",
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.2)",
                  "& .MuiListItemText-root .MuiTypography-root": {
                    color: "#0d47a1",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  );
};


export default PatientSidebar;