import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar";
import AdminNavbar from "../AdminNavbar";
import React from "react";


const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar open={sidebarOpen} onToggle={toggleSidebar} />
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: "#f5f7fb",
        }}
      >
        <AdminNavbar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />
        <Outlet />
      </Box>

    </Box>
  );
};

export default AdminLayout;
