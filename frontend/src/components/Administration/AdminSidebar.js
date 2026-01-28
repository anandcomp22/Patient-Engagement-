import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box, Tooltip,} from "@mui/material";
import {
  Dashboard, LocalHospital, People, Event, Payments, VerifiedUser, BarChart, History, Security,
  LoginOutlined, Help, Settings, ChevronLeft as ChevronLeftIcon, Menu as MenuIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import Aidme from "../Doctor/icons/logo.png";

const AdminSidebar = ({ open, onToggle }) => {
  const { pathname } = useLocation();

  const menu = [
    { text: "Dashboard", icon: <Dashboard />, path: "/admin/dashboard" },
    { text: "Doctors", icon: <LocalHospital />, path: "/admin/doctors" },
    { text: "Patients", icon: <People />, path: "/admin/patients" },
    { text: "Activity Logs", icon: <History />, path: "/admin/logs" },
    { text: "Verification", icon: <VerifiedUser />, path: "/admin/verify" },
    { text: "Payments", icon: <Payments />, path: "/admin/payments" },
    { text: "Analytics", icon: <BarChart />, path: "/admin/analytics" }
  ];

  const footerItems = [
      { text: "Settings", icon: <Settings />, to: "/admin/settings" },
      { text: "Logout", icon: <LoginOutlined />, to: "/admin/login" },
    ];

  return (
    <Drawer
          variant="permanent"
          open={open}
          PaperProps={{
            sx: {
              width: open ? 240 : 62,
              position: "fixed",
              height: "100vh",
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
            {menu.map((item) => (
              <Tooltip title={!open ? item.text : ""} placement="right" key={item.text}>
                <ListItem
                  button
                  component={Link}
                  to={item.path}
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
                    ...(pathname === item.path && {
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

export default AdminSidebar;
