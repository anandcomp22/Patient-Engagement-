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
import { Notifications, Settings, AdminPanelSettings } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";

const AdminNavbar = ({ sidebarOpen }) => {
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
        width: sidebarOpen ? "calc(100% - 250px)" : "calc(100% - 62px)",
        ml: sidebarOpen ? "220px" : "62px",
        transition: "all 0.3s ease-in-out",
        bgcolor: "background.paper",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.05)",
        borderRadius: "0px 0px 20px 20px",
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ display: "flex", alignItems: "center", px: 3 }}>
        
        {/* Search */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search admin data..."
            size="small"
            sx={{
              width: 260,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton sx={{ color: "gray" }}>
            <Notifications />
          </IconButton>

          <IconButton sx={{ color: "gray" }}>
            <Settings />
          </IconButton>

          <Avatar
            sx={{
              backgroundImage:
                "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"
            }}
          >
            {adminName?.charAt(0) || "A"}
          </Avatar>

          <Box>
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
              px: 1.5,
              "&:hover": {
                backgroundColor: "#f0f7ff",
                borderColor: "#1E5DA9"
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavbar;
