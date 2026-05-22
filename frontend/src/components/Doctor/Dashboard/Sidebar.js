import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import {
  Dashboard,
  CalendarMonth,
  People,
  Medication,
  VideoCall,
  Analytics,
  Settings,
  Help,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  LoginOutlined,
} from "@mui/icons-material";
import Aidme from "./icons/logo.png";

const Sidebar = ({ open, onToggle, isMobile, onMobileClose }) => {
  const { pathname } = useLocation();

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, to: "/doctor/dashboard" },
    { text: "Appointments", icon: <CalendarMonth />, to: "/doctor/appointments" },
    { text: "Patients Details", icon: <People />, to: "/doctor/patients" },
    { text: "Prescriptions", icon: <Medication />, to: "/doctor/prescriptions" },
    { text: "Video Calls", icon: <VideoCall />, to: "/doctor/video-call" },
    { text: "Analytics", icon: <Analytics />, to: "/doctor/analysis" },
  ];

  const footerItems = [
    { text: "Settings", icon: <Settings />, to: "/doctor/settings" },
    { text: "Help & Support", icon: <Help />, to: "/doctor/help" },
    { text: "Logout", icon: <LoginOutlined />, to: "/" },
  ];

  const handleNavClick = () => {
    if (isMobile && onMobileClose) onMobileClose();
  };

  const drawerContent = (
    <>
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
              component={Link}
              to={item.to}
              onClick={handleNavClick}
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
      <Box sx={{ borderTop: "3px solid rgba(255,255,255,0.3)", my: 2 }} />

      {/* Footer Items */}
      <List>
        {footerItems.map((item) => (
          <Tooltip title={!open ? item.text : ""} placement="right" key={item.text}>
            <ListItem
              component={Link}
              to={item.to}
              onClick={handleNavClick}
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
    </>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true}
      onClose={onToggle}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isMobile ? 260 : (open ? 240 : 62),
          position: "fixed",
          height: "100vh",
          transition: "width 0.3s ease-in-out",
          bgcolor: "primary.light",
          backgroundImage: "linear-gradient(135deg, #bee3fdff 0%, #008cffff 100%)",
          color: "white",
          boxShadow: 3,
          overflowX: "hidden",
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
