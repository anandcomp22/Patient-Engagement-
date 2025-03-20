import React from "react";
import { Box, Typography, Card, Button, Avatar, Chip } from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import { useNavigate } from "react-router-dom";

const appointments = [
  { id: 1, name: "John Doe", details: "Follow-up for hypertension", time: "10:00 AM", status: "Confirmed" },
  { id: 2, name: "Emily Johnson", details: "Consultation for migraines", time: "11:30 AM", status: "Confirmed" },
  { id: 3, name: "Robert Smith", details: "Diabetes check-up", time: "1:15 PM", status: "Pending" },
];

const LiveVideoCall = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 3, mt: 5 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Video Call Appointments
      </Typography>

      {appointments.map((item) => (
        <Card key={item.id} sx={{ mb: 2, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: 2 }}>
          {/* Left: Patient Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar>{item.name[0]}</Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">{item.name}</Typography>
              <Typography variant="body2" color="textSecondary">{item.details}</Typography>
            </Box>
          </Box>

          {/* Right: Status & Video Call Button */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip label={item.status} color={item.status === "Confirmed" ? "success" : "warning"} variant="outlined" />
            
            {/* Start Video Call Button */}
            {item.status === "Confirmed" && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<VideoCallIcon />}
                onClick={() => navigate(`/video-call/${item.id}`)}
              >
                Start Video Call
              </Button>
            )}
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default LiveVideoCall;
