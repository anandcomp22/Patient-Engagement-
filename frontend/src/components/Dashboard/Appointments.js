import {
  Box, Typography, Button, Card, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

const Appointments = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: "", patientId: "", doctorId: "" });
  const [viewDialog, setViewDialog] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("time");
  

  const fetchAppointments = async () => {
    const res = await fetch("http://localhost:8000/appointment/all"); // if available
    const data = await res.json();
    setAppointmentsData(data);
    // Replace with actual API call if needed
    setAppointmentsData([
      { id: 1, patientId: 101, name: "Sayyoni Parate", details: "Diabetes check-up", time: "10:00 AM", status: "Confirmed" },
      { id: 2, patientId: 102, name: "Sujal Shahare", details: "General check-up", time: "11:00 AM", status: "Pending" },
    ]);
  };

  useEffect(() => {
    fetchAppointments();
    socket.on("appointment-updated", fetchAppointments);
    return () => socket.off("appointment-updated");
  }, []);

  useEffect(() => {
    let filtered = appointmentsData.filter(appt =>
      appt.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortBy === "time") {
      filtered.sort((a, b) => new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredAppointments(filtered);
  }, [searchTerm, sortBy, appointmentsData]);

  const handleMarkCompleted = async (id) => {
    await fetch(`http://localhost:8000/appointment/complete/${id}`, { method: "PUT" });
    socket.emit("appointment-update");
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/appointment/delete/${id}`, { method: "DELETE" });
    socket.emit("appointment-update");
  };

  const handleViewDetails = async (id) => {
    const res = await fetch(`http://localhost:8000/appointment/details/${id}`);
    const data = await res.json();
    setViewDialog(data);
  };

  const changeDate = (days) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const handleAddAppointment = async () => {
    const res = await fetch("http://localhost:8000/appointment/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setFormData({ date: "", patientId: "", doctorId: "" });
      socket.emit("appointment-update");
    }
  };

  const handleReschedule = async () => {
    await fetch(`http://localhost:8000/appointment/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: rescheduleDialog.id, newDate: rescheduleDate })
    });
    setRescheduleDialog(null);
    setRescheduleDate("");
    socket.emit("appointment-update");
  };


  return (
    <Box sx={{ padding: 3, mt: 5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Appointments</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder="Search by patient name"
            size="small"
            sx={{ width: 250 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button onClick={() => setSortBy(sortBy === "time" ? "name" : "time")}>
            Sort by {sortBy === "time" ? "Name" : "Time"}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Appointment"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", py: 2, backgroundColor: "#f9f9f9", borderRadius: 2 }}>
        <IconButton onClick={() => changeDate(-1)}><ArrowBackIosNewIcon /></IconButton>
        <Box sx={{ textAlign: "center", flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
          </Typography>
        </Box>
        <IconButton onClick={() => changeDate(1)}><ArrowForwardIosIcon /></IconButton>
      </Box>

      {showForm && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f3f3f3", borderRadius: 2 }}>
          <TextField fullWidth label="Patient ID" sx={{ mb: 2 }} value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} />
          <TextField fullWidth label="Doctor ID" sx={{ mb: 2 }} value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })} />
          <TextField fullWidth type="date" sx={{ mb: 2 }} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          <Button variant="contained" onClick={handleAddAppointment}>Submit Appointment</Button>
        </Box>
      )}

      <Box sx={{ mt: 6 }}>
        {filteredAppointments.map((item) => (
          <Card key={item.id} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar>{item.name?.[0]}</Avatar>
                <Box>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2" color="textSecondary">{item.details}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">{item.time}</Typography>
                <Chip label={item.status} color={item.status === "Confirmed" ? "success" : "warning"} variant="outlined" />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              <Button variant="outlined" size="small" onClick={() => handleViewDetails(item.id)}>View</Button>
              <Button variant="outlined" size="small" onClick={() => setRescheduleDialog(item)}>Reschedule</Button>
              <Button variant="contained" size="small" onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:8000/appointment/room/${item.appointmentId}`);
                  const data = await res.json();
                  if (data.roomId) {
                    navigate(`/video-call/${data.roomId}`, {
                      state: { patient: data.patient },
                    });
                  } else {
                    alert("Room not found");
                  }
                } catch (err) {
                  console.error("Failed to start video call:", err);
                }
              }}>
                Start Video
              </Button>
              <Button variant="outlined" color="success" size="small" onClick={() => handleMarkCompleted(item.id)}>Done</Button>
              <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(item.id)}>Cancel</Button>
            </Box>
          </Card>
        ))}
      </Box>

      <Dialog open={Boolean(viewDialog)} onClose={() => setViewDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {viewDialog && (
            <>
              <Typography><strong>Patient Name:</strong> {viewDialog.patientDetails?.name}</Typography>
              <Typography><strong>Email:</strong> {viewDialog.patientDetails?.email}</Typography>
              <Typography><strong>Phone:</strong> {viewDialog.patientDetails?.phone}</Typography>
              <Typography><strong>Age:</strong> {viewDialog.patientDetails?.age}</Typography>
              <Typography><strong>Status:</strong> {viewDialog.appstatus}</Typography>
              <Typography><strong>Date:</strong> {new Date(viewDialog.date).toLocaleDateString()}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rescheduleDialog)} onClose={() => setRescheduleDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReschedule} variant="contained">Submit</Button>
          <Button onClick={() => setRescheduleDialog(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;