import React from "react";
import { Box, Typography, Card, Avatar, Chip } from "@mui/material";


const appointments = [
  { id: 1, name: "Shreyas Sadavarte", details: "Follow-up for hypertension", time: "10:00 AM", status: "Appointment Done" },
  { id: 2, name: "Prathmesh Vharkal", details: "Consultation for migraines", time: "11:30 AM", status: "Appointment Done" },
  { id: 3, name: "Sayyoni Parate", details: "Diabetes check-up", time: "1:15 PM", status: "Pending" },
];
const LiveVideoCall = () => {

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
            <Chip label={item.status} color={item.status === "Appointment Done" ? "success" : "warning"} variant="outlined" />
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default LiveVideoCall;
