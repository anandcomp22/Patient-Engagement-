import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, Card, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, Divider, Grid, Paper, Tooltip
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VideocamIcon from "@mui/icons-material/Videocam";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const socket = io(API_BASE);

const Appointments = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    appointmentDate: "",
    time: "",
    patientId: "",
    patientAge: "",
    patientPhone: "",
    patientName: "",
    patientEmail: "",
    doctorName: "",
    reason: ""
  });
  const [viewDialog, setViewDialog] = useState(null);
  const [rescheduleDialog, setRescheduleDialog] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState("");
  const [patientsList, setPatientsList] = useState([]); // List of patients for the dropdown

  const DoctorName = localStorage.getItem("doctorName") || "";

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [resApp, resPat] = await Promise.all([
        axios.get(`${API_BASE}/appointment/app`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { t: new Date().getTime() }
        }),
        axios.get(`${API_BASE}/doctor/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointmentsData(resApp.data);
      // Remove duplicate patients
      const uniquePatients = Array.from(new Map(resPat.data.map(p => [p.patientId, p])).values());
      setPatientsList(uniquePatients);
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments or patients.");
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
    let filtered = appointmentsData.filter(appt => {
      // Basic date matching
      const d1 = new Date(appt.appointmentDate);
      const d2 = new Date(selectedDate);
      const isSameDay = d1.getFullYear() === d2.getFullYear() &&
                        d1.getMonth() === d2.getMonth() &&
                        d1.getDate() === d2.getDate();
                        
      const matchesSearch = appt.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
      return isSameDay && matchesSearch;
    });

    if (sortBy === "time") {
      filtered.sort((a, b) => new Date(`1970/01/01 ${a.startTime || "00:00"}`) - new Date(`1970/01/01 ${b.startTime || "00:00"}`));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => (a.patientName || "").localeCompare(b.patientName || ""));
    }
    setFilteredAppointments(filtered);
  }, [searchTerm, sortBy, appointmentsData, selectedDate]);  

  const handleDelete = async (appointmentId) => {
    try {
      await axios.delete(`${API_BASE}/appointment/delete/${appointmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      socket.emit("appointment-update");
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const handleViewDetails = async (appointmentId) => {
    try {
      const res = await axios.get(`${API_BASE}/appointment/details/${appointmentId}`, {
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
        time: formData.time,
        patientId: Number(formData.patientId),
        reason: formData.reason,
        doctorId: localStorage.getItem("doctorId")
      };

      const res = await axios.post(
        `${API_BASE}/appointment/book`, // assuming backend is mounted appropriately
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setShowForm(false);
        setFormData({ appointmentDate: "", time: "", patientId: "", reason: "" });
        socket.emit("appointment-update");
        fetchAppointments();
      } else {
        alert(res.data.message || "Failed to book appointment");
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
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    };
  };

  const handleReschedule = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/appointment/reschedule`, {
        appointmentId: rescheduleDialog.appointmentId, newDate: rescheduleDate
      }, { headers: { Authorization: `Bearer ${token}` }});
      setRescheduleDialog(null);
      setRescheduleDate("");
      socket.emit("appointment-update");
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  return (
    <Box sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: 'column', sm: 'row' }, justifyContent: "space-between", alignItems: { xs: 'stretch', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E5DA9", fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>Appointments Calendar</Typography>
          <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>Manage and schedule your patient consultations efficiently.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} 
          sx={{ background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)", borderRadius: 2, fontWeight: 700, textTransform: "none", boxShadow: "0 4px 14px rgba(30,93,169,0.2)", alignSelf: { xs: 'stretch', sm: 'auto' } }} 
          onClick={() => setShowForm(true)}
        >
          New Appointment
        </Button>
      </Box>

      {/* Filters and Date Bar */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: "flex", flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: "space-between", gap: 2, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search patients..."
            size="small"
            sx={{ width: { xs: '100%', sm: 280 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#888" }} /></InputAdornment> }}
          />
          <Button variant="outlined" sx={{ borderRadius: 2, textTransform: "none", borderColor: "rgba(0,0,0,0.15)", color: "#555" }} onClick={() => setSortBy(sortBy === "time" ? "name" : "time")}>
            Sort: {sortBy === "time" ? "Time" : "Name"}
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, background: "#f8fafc", p: "4px 12px", borderRadius: 3, border: "1px solid rgba(0,0,0,0.05)", justifyContent: 'center' }}>
          <IconButton size="small" onClick={() => changeDate(-1)} sx={{ color: "#1E5DA9" }}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
          <Box sx={{ textAlign: "center", minWidth: { xs: 120, sm: 160 } }}>
            <Typography variant="subtitle2" fontWeight="700" color="#333">
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
            <Typography variant="caption" color="#777">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => changeDate(1)} sx={{ color: "#1E5DA9" }}><ArrowForwardIosIcon fontSize="small" /></IconButton>
        </Box>
      </Paper>

      {/* Add Appointment Modal */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9" }}>Schedule Appointment</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          
          <TextField select fullWidth size="small" label="Select Patient" value={formData.patientId} 
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="" disabled></option>
            {patientsList.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.firstName} {p.lastName} — ID: {p.patientId}
              </option>
            ))}
          </TextField>

          <TextField fullWidth size="small" label="Date" type="date" InputLabelProps={{ shrink: true }} value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} />
          <TextField fullWidth size="small" label="Time" type="time" InputLabelProps={{ shrink: true }} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
          <TextField fullWidth size="small" label="Reason for Visit" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
          
          {patientsList.length === 0 && (
            <Typography variant="caption" color="error">
              No registered patients found. Please add patients from the Patient Directory first.
            </Typography>
          )}

        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setShowForm(false)} sx={{ textTransform: "none", color: "#555" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAppointment} sx={{ background: "#1E5DA9", textTransform: "none", borderRadius: 2 }}>Confirm Booking</Button>
        </DialogActions>
      </Dialog>

      {/* Main Grid */}
      {loading ? (
        <Typography sx={{ mt: 4, textAlign: "center", color: "#777" }}>Loading appointments...</Typography>
      ) : error ? (
        <Typography color="error" sx={{ mt: 4, textAlign: "center" }}>{error}</Typography>
      ) : filteredAppointments.length === 0 ? (
        <Box sx={{ height: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 2 }}>
          <EventBusyIcon sx={{ fontSize: 72, color: "rgba(30,93,169,0.3)" }} />
          <Typography variant="h5" fontWeight="700" color="#333">No Appointments Found</Typography>
          <Typography variant="body2" color="#777" sx={{ maxWidth: 360 }}>Your schedule is clear for this selected date. Enjoy your day or book a new consultation!</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAppointments.map((item) => {
            return (
              <Grid item xs={12} md={6} lg={4} key={item.appointmentId || item._id}>
                <Paper sx={{
                  p: 3, borderRadius: 4, background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.04)", transition: "all 0.2s ease-in-out",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(30,93,169,0.12)", borderColor: "rgba(30,93,169,0.3)" }
                }}>
                  {/* Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)", color: "#fff", width: 48, height: 48, fontWeight: 700 }}>
                        {item.patientName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} color="#1E5DA9">
                          {item.patientName}
                        </Typography>
                        <Chip size="small" sx={{ mt: 0.5, height: 20, fontSize: "0.65rem", fontWeight: 700, background: "#E3F2FD", color: "#1E5DA9" }} label={item.appstatus || "Scheduled"} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="View Full Details">
                        <IconButton size="small" onClick={() => handleViewDetails(item.appointmentId)} sx={{ color: "#555", background: "#f0f4f8" }}>
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel Appointment">
                        <IconButton size="small" onClick={() => handleDelete(item.appointmentId)} sx={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                          <EventBusyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Meta Info */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3, p: 2, borderRadius: 3, background: "#f8fafc" }}>
                    <Typography sx={{ fontSize: "0.8rem", color: "#555", display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon fontSize="small" sx={{ color: "#1E5DA9" }} />
                      <strong>{item.startTime}</strong> — {formatDateTime(item.appointmentDate).date}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: "#555", display: "flex", alignItems: "center", gap: 1 }}>
                      <DescriptionIcon fontSize="small" sx={{ color: "#1E5DA9" }} />
                      {item.reason || "General Checkup"}
                    </Typography>
                  </Box>
                  
                  {/* Actions */}
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button fullWidth variant="outlined" size="small" onClick={() => setRescheduleDialog(item)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "rgba(30,93,169,0.3)", color: "#1E5DA9", "&:hover": { background: "rgba(30,93,169,0.05)"} }}>
                      Reschedule
                    </Button>
                    <Button fullWidth variant="contained" size="small" startIcon={<VideocamIcon />}
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/appointment/room/${item.appointmentId}`);
                          const data = await res.json();
                          if (data.roomId) {
                            navigate(`/doctor/video-call?roomId=${data.roomId}&patientEmail=${item.patientEmail}&patientName=${encodeURIComponent(item.patientName || "")}&patientId=${item.patientId}`);
                          } else {
                            alert("Room not found");
                          }
                        } catch (err) { console.error(err); }
                      }}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "#1E5DA9", boxShadow: "none", "&:hover": { background: "#0f3f7a" } }}>
                      Join Call
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* View Details Modal */}
      <Dialog open={Boolean(viewDialog)} onClose={() => setViewDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9", pb: 1 }}>Patient Dossier</DialogTitle>
        <DialogContent>
          {viewDialog && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, p: 2, background: "#f8fafc", borderRadius: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#1E5DA9", fontSize: "1.5rem" }}>{viewDialog.patientDetails?.name?.[0]}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="700" color="#333">{viewDialog.patientDetails?.name}</Typography>
                  <Typography variant="body2" color="#777">Patient ID: {viewDialog.patientId}</Typography>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="caption" color="#888">Age</Typography><Typography fontWeight="600">{viewDialog.patientDetails?.age || "N/A"} years</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="#888">Status</Typography><Chip size="small" label={viewDialog.appstatus} sx={{ mt: 0.5, display: 'block', width: 'fit-content' }} /></Grid>
                <Grid item xs={6}><Typography variant="caption" color="#888">Phone</Typography><Typography fontWeight="600">{viewDialog.patientDetails?.phone || "N/A"}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="#888">Email</Typography><Typography fontWeight="600">{viewDialog.patientDetails?.email || "N/A"}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="#888">Date & Time</Typography><Typography fontWeight="600">{new Date(viewDialog.appointmentDate).toLocaleDateString()} at {viewDialog.startTime}</Typography></Grid>
                <Grid item xs={12}><Typography variant="caption" color="#888">Reason for Visit</Typography><Typography fontWeight="600">{viewDialog.reason || "General Checkup"}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(null)} sx={{ textTransform: "none", fontWeight: 600 }}>Close Dossier</Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={Boolean(rescheduleDialog)} onClose={() => setRescheduleDialog(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9" }}>Reschedule Box</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 3, color: "#555" }}>Select a new date and time for this appointment.</Typography>
          <TextField fullWidth type="datetime-local" InputLabelProps={{ shrink: true }} label="New Schedule" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRescheduleDialog(null)} sx={{ color: "#555" }}>Cancel</Button>
          <Button onClick={handleReschedule} variant="contained" sx={{ background: "#1E5DA9" }}>Update Request</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;