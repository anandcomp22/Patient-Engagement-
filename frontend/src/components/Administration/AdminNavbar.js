import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Avatar
} from "@mui/material";
import { Settings, Menu as MenuIcon } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationBell from "../Common/NotificationBell";

const AdminNavbar = ({ sidebarOpen, onToggle, isMobile }) => {
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
  const syncAdmin = () => {
    setAdminName(localStorage.getItem("adminName") || "Admin");
    setAdminEmail(localStorage.getItem("adminEmail") || "");
  };

  syncAdmin();
  window.addEventListener("storage", syncAdmin);

  return () => window.removeEventListener("storage", syncAdmin);
}, []);


  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: isMobile ? "100%" : (sidebarOpen ? "calc(100% - 250px)" : "calc(100% - 62px)"),
        ml: isMobile ? 0 : (sidebarOpen ? "220px" : "62px"),
        transition: "all 0.3s ease-in-out",
        bgcolor: "background.paper",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.05)",
        borderRadius: "0px 0px 20px 20px",
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ display: "flex", alignItems: "center", px: { xs: 1, sm: 2, md: 3 } }}>
        
        {/* Hamburger menu for mobile */}
        {isMobile && (
          <IconButton
            onClick={onToggle}
            sx={{ color: "#1E5DA9", mr: 1 }}
            aria-label="open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Search — hidden on mobile */}
        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search admin data..."
            size="small"
            sx={{
              width: { sm: 200, md: 260 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "grey.100",
                "& fieldset": { border: "none" }
              }
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1, md: 2 } }}>
          <NotificationBell role="admin" userId="admin" />

          <IconButton sx={{ color: "gray", display: { xs: "none", sm: "inline-flex" } }}>
            <Settings />
          </IconButton>

          <Avatar
            sx={{
              backgroundImage:
                "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
            }}
          >
            {adminName?.charAt(0) || "A"}
          </Avatar>

          {/* Hide name/email on mobile */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="subtitle2" color="text.primary">
              {adminName || "Admin"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {adminEmail || "admin@example.com"}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              color: "#1E5DA9",
              borderColor: "#1E5DA9",
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": {
                backgroundColor: "#f0f7ff",
                borderColor: "#1E5DA9"
              }
            }}
          >
            Logout
          </Button>
          {/* Mobile logout — icon only */}
          <IconButton
            onClick={handleLogout}
            sx={{ color: "#1E5DA9", display: { xs: "inline-flex", sm: "none" } }}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavbar;
