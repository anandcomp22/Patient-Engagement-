import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const VideoCall = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", mt: 10 }}>
      {/* Title Section */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, textAlign: "center" }}>
        Live Video Consultation
      </Typography>

      {/* Main Content */}
      <Box sx={{ display: "flex", flexGrow: 1, gap: 2, px: 3 }}>
        {/* Video Section (70%) */}
        <Paper
          elevation={3}
          sx={{
            flex: 7, // Takes 70% of the screen
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000",
            color: "white",
            height: "80vh",
          }}
        >
          <Typography variant="h6">Doctor & Patient Live Video</Typography>
        </Paper>

        {/* Prescription Section (30%) */}
        <Paper
          elevation={3}
          sx={{
            flex: 3, // Takes 30% of the screen
            padding: 2,
            height: "80vh",
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Prescription Generation
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Add doctor's notes, prescribed medicines, and instructions here.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default VideoCall;
