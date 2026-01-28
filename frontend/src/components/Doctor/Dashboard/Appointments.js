import {
  Box, Typography, Button, Card, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment,Divider,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
const API_BASE = process.env.REACT_APP_API_URL;

const socket = io(API_BASE);

const Appointments = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
  appointmentDate: "",
  patientId: "",
  patientAge: "",
  patientPhone: "",
  patientName: "",
  patientEmail: ""
});
  const [viewDialog, setViewDialog] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


const fetchAppointments = async () => {
  setLoading(true);
  setError("");
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE}/doctor/app`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { t: new Date().getTime() }
    });

    setAppointmentsData(res.data);
  } catch (err) {
    console.error(err);
    setError("Failed to load appointments.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAppointments();
    socket.on("appointment-updated", fetchAppointments);
    return () => socket.off("appointment-updated");
  }, []);

  useEffect(() => {
    if (!Array.isArray(appointmentsData)) return;
    let filtered = appointmentsData.filter(appt =>
      appt.patientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortBy === "time") {
      filtered.sort((a, b) => new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredAppointments(filtered);
  }, [searchTerm, sortBy, appointmentsData]);  
  

  const handleDelete = async (appointmentId) => {
  try {
    await axios.delete(`${API_BASE}/appointments/delete/${appointmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    socket.emit("appointment-update");
    fetchAppointments();
  } catch (err) { console.error(err); }
};

  const handleViewDetails = async (appointmentId) => {
  try {
    const res = await axios.get(`${API_BASE}/doctor/appointments/details/${appointmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setViewDialog(res.data);
  } catch (err) { console.error(err); }
};

  const changeDate = (days) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const handleAddAppointment = async () => {
  try {
    const token = localStorage.getItem("token");
    const payload = {
      appointmentDate: formData.appointmentDate,
      patientId: Number(formData.patientId),
      patientAge: Number(formData.patientAge),
      patientPhone: formData.patientPhone,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      doctorName: formData.doctorName,
      reason: formData.reason
    };


  await axios.post(
    `${API_BASE}/appointments/book`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

    if (data.success) {
      setShowForm(false);
      setFormData({
        patientId: "",
        patientName: "",
        patientEmail: "",
        doctorName: "",
        appointmentDate: "",
        reason: ""
      });
      socket.emit("appointment-update");
      fetchAppointments();
    } else {
      alert(data.message || "Failed to book appointment");
    }
  } catch (err) {
    console.error(err);
    alert("Booking failed");
  }
};

const formatDateTime = (iso) => {
  if (!iso) return { date: "N/A", time: "N/A" };

  const d = new Date(iso);

  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};


  
  const handleReschedule = async () => {
  try {
    const token = localStorage.getItem("token");
    await axios.put(`${API_BASE}/doctor/appointments/reschedule`, {
      appointmentId: rescheduleDialog.appointmentId, newDate: rescheduleDate
    }, { headers: { Authorization: `Bearer ${token}` }});
    setRescheduleDialog(null);
    setRescheduleDate("");
    socket.emit("appointment-update");
    fetchAppointments();
  } catch (err) { console.error(err); }
};

  return (
    <Box sx={{ padding: 2, mt: 3 }}>
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
          <TextField fullWidth type="date" sx={{ mb: 2 }} value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} />
          <Button sx={{ backgroundColor: '#1976d2', color: '#fff', '&:hover': { backgroundColor: '#1976d2' } }} onClick={handleAddAppointment}>
            Submit Appointment
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 6 }}>
      {loading ? (
        <Typography sx={{ mt: 4 }}>Loading appointments...</Typography>
      ) : error ? (
        <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>
      ) : filteredAppointments.length === 0 ? (
        <Box
          sx={{
            mt: 6,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card
            sx={{
              p: 5,
              maxWidth: 400,
              textAlign: "center",
              borderRadius: 3,
              background: "linear-gradient(135deg, #f9f9ff, #ffffff)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <EventBusyIcon
              sx={{
                fontSize: 64,
                color: "#1976d2",
                mb: 2,
              }}
            />

            <Typography variant="h6" fontWeight="bold">
              No Appointments
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              There are no appointments scheduled for this date.
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                mt: 2,
                px: 3,
                borderRadius: 2,
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1976d2" },
              }}
              onClick={() => setShowForm(true)}
            >
              Add Appointment
            </Button>
          </Card>
        </Box>
      ) : (

        filteredAppointments.map((item) => {
          const { date, time } = formatDateTime(item.appointmentDate);
          return (
          <Card
            key={item.appointmentId || item._id}
            sx={{
              mb: 1,
              p: 2,
              borderRadius: 3,
              height: "175px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              },
            }}
          >
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#1976d2", width: 48, height: 48 }}>
                  {item.patientName?.[0]}
                </Avatar>

                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {item.patientName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.reason || "General Consultation"}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={item.appstatus}
                color={
                  item.appstatus === "confirmed"
                    ? "success"
                    : item.appstatus === "Completed"
                    ? "info"
                    : "warning"
                }
                variant="outlined"
              />
            </Box>

            {/* Date & Time */}
            <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end", gap: 2, alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography fontWeight={500}>{time}</Typography>
                </Box>
                <Typography fontWeight={500}>{date}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Actions */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => handleViewDetails(item.appointmentId)}>
                View
              </Button>

              <Button size="small" variant="outlined" onClick={() => setRescheduleDialog(item)}>
                Reschedule
              </Button>

              <Button
                size="small"
                variant="contained"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/appointment/room/${item.appointmentId}`);
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
                }}
              >
                Start Video
              </Button>

              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleDelete(item.appointmentId)}
              >
                Cancel
              </Button>
            </Box>
          </Card>
          );
        })
      )}
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
              <Typography><strong>Date:</strong> {new Date(viewDialog.appointmentDate).toLocaleDateString()}</Typography>
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
          <TextField fullWidth type="appointmentDate" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
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