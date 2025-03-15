import React from "react";
import { CssBaseline, Box } from "@mui/material";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Sidebar />
      <Box className="main-content">
        <Navbar />
        <Dashboard />
      </Box>
    </Box>
  );
}

export default App;
