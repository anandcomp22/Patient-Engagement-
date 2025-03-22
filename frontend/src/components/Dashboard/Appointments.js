import { Box, Typography, Button, Card, Avatar, Chip, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 

const appointments = [
    { id: 1, name: "Shreyas Sadavarte", details: "Follow-up on blood pressure medication", time: "10:00 AM", status: "Confirmed" },
    { id: 2, name: "Prathmesh Vharkal", details: "Initial consultation for chronic migraines", time: "11:30 AM", status: "Confirmed" },
    { id: 3, name: "Sayyoni Parate", details: "Diabetes management check-in", time: "1:15 PM", status: "Pending" },
];

const Appointments = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date(2025, 1, 28));

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <Box sx={{ padding: 3, mt: 5 }}>
            {/* Header Section */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">Appointments</Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: "none" }}>
                        Filter
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ textTransform: "none" }}>
                        Add Appointment
                    </Button>
                </Box>
            </Box>

            {/* Date Navigation Section */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, backgroundColor: "#f9f9f9", borderRadius: 2 }}>
                <IconButton onClick={() => changeDate(-1)} sx={{ ml: 2 }}>
                    <ArrowBackIosNewIcon />
                </IconButton>
                <Box sx={{ textAlign: "center", flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                    </Typography>
                </Box>
                <IconButton onClick={() => changeDate(1)} sx={{ mr: 2 }}>
                    <ArrowForwardIosIcon />
                </IconButton>
            </Box>

            {/* Today's Schedule Section */}
            <Box sx={{ mt: 10 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Today's Schedule</Typography>

                {appointments.map((item, index) => (
                <Card key={index} sx={{ mb: 2, p: 2, display: "flex", flexDirection: "column", boxShadow: 2 }}>
                    {/* Top Section */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar>{item.name[0]}</Avatar>
                    <Box>
                            <Typography variant="h6" fontWeight="bold">{item.name}</Typography>
                            <Typography variant="body2" color="textSecondary">{item.details}</Typography>
                    </Box>
                </Box>

                    {/* Right Section */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AccessTimeIcon fontSize="small" />
                        <Typography variant="body2">{item.time}</Typography>
                    </Box>
                    <Chip
                        label={item.status}
                        color={item.status === "Confirmed" ? "success" : "warning"}
                        variant="outlined"
                    />
                    <Chip label="Video" color="primary" variant="outlined" />
                </Box>
            </Box>

                {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button variant="outlined" size="small">View Details</Button>
                {item.status === "Confirmed" && (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        startIcon={<VideoCallIcon />} 
                        onClick={() => navigate(`/video-call/${index}`)} // Now correctly passing index
                    >
                        Start Video
                    </Button>
                )}
                <Button variant="outlined" size="small">Reschedule</Button>
            </Box>
        </Card>
            ))}
            </Box>
        </Box>
    );
};

export default Appointments;
