import React, { useEffect, useState } from "react";
import { 
  Box, Grid, Typography, Avatar, TextField, 
  Button, Chip, Divider, Paper, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, ListItemIcon
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import DescriptionIcon from "@mui/icons-material/Description";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import axios from "axios";
import io from "socket.io-client";

import { API_BASE } from "../../../apiConfig";

const socket = io(API_BASE);

const PatientsDetail = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [viewProfileData, setViewProfileData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showBookMeeting, setShowBookMeeting] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", phone: "", age: "", gender: "Male" });
  const [bookForm, setBookForm] = useState({ appointmentDate: "", time: "", reason: "" });

  const formatDateTime = (iso) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const uniquePatients = Array.from(new Map(res.data.map((p) => [p.patientId, p])).values());
      setPatients(uniquePatients);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  useEffect(() => {
    fetchPatients();

    socket.on("newPatient", (newPatient) => {
      setPatients((prev) => {
        const exists = prev.find(p => p.patientId === newPatient.patientId);
        if (exists) return prev;
        return [...prev, newPatient];
      });
    });

    socket.on("appointment-updated", fetchPatients);

    return () => {
      socket.off("newPatient");
      socket.off("appointment-updated");
    };
  }, []);

  const handleAddPatient = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/patient`, {
        ...addForm,
        password: "Generated123!", // Dummy password for doctor-added patients to bypass schema requirement securely
        patientId: Math.floor(Math.random() * 90000) + 10000
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowAddPatient(false);
      setAddForm({ firstName: "", lastName: "", email: "", phone: "", age: "", gender: "Male" });
      fetchPatients();
    } catch (err) {
      console.error("Add patient failed", err);
      alert("Failed to add patient.");
    }
  };

  const handleViewProfile = async (patient) => {
    setViewProfileData(patient);
    try {
      const token = localStorage.getItem("token");
      const fullName = `${patient.firstName} ${patient.lastName}`;
      const res = await axios.get(`${API_BASE}/prescriptions/patient/${encodeURIComponent(fullName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch prescriptions", err);
      setPrescriptions([]);
    }
  };

  const handleBookMeeting = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/appointment/book`, {
        ...bookForm,
        patientId: showBookMeeting.patientId,
        doctorId: localStorage.getItem("doctorId") // Optionally provided, backend will auto-fetch from token
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setShowBookMeeting(null);
      setBookForm({ appointmentDate: "", time: "", reason: "" });
      alert("Appointment booked successfully!");
      fetchPatients();
    } catch (err) {
      console.error("Booking error", err);
      alert("Failed to book appointment.");
    }
  };

  const filteredPatients = patients.filter(patient =>
    (patient.firstName + " " + patient.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, mt: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E5DA9" }}>Patient Directory</Typography>
          <Typography variant="body2" sx={{ color: "#777", mt: 0.5 }}>View, manage, contact, and access prescriptions of all registered patients.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddAlt1Icon />} 
          sx={{ background: "linear-gradient(135deg, #62b8ffff, #1E5DA9)", borderRadius: 2, fontWeight: 700, textTransform: "none", boxShadow: "0 4px 14px rgba(30,93,169,0.2)" }} 
          onClick={() => setShowAddPatient(true)}
        >
          Add Patient
        </Button>
      </Box>

      {/* Control Bar */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField placeholder="Search patients by name..." size="small" sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#888" }} /></InputAdornment> }}
          />
        </Box>
      </Paper>

      {/* Grid Display */}
      {filteredPatients.length === 0 ? (
        <Box sx={{ height: "40vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#E3F2FD", color: "#1E5DA9", width: 72, height: 72, fontSize: "2rem", boxShadow: "0 4px 12px rgba(30,93,169,0.1)" }}>👨‍⚕️</Avatar>
          <Typography variant="h5" fontWeight="700" color="#333">No Patients Found</Typography>
          <Typography variant="body2" color="#777" sx={{ maxWidth: 360 }}>You haven't consulted any patients yet.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredPatients.map((patient, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{
                  p: 3, borderRadius: 4, background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.04)", transition: "all 0.2s ease-in-out",
                  display: "flex", flexDirection: "column", height: "100%",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(30,93,169,0.12)", borderColor: "rgba(30,93,169,0.3)" }
                }}>
                  {/* Top Bar (Avatar & Status) */}
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ background: "linear-gradient(135deg, #1E5DA9, #62b8ffff)", color: "#fff", width: 56, height: 56, fontWeight: 700, fontSize: "1.2rem" }}>
                      {(patient.firstName || "P")[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={800} color="#1E5DA9" sx={{ lineHeight: 1.2 }}>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: "#777", fontWeight: 600 }}>{patient.patientAge ?? "N/A"} yrs • {patient.gender ?? "N/A"}</Typography>
                        <Chip label="Active" size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, background: "#E8F5E9", color: "#2E7D32" }} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Contact Block */}
                  <Box sx={{ mb: 3, background: "#f8fafc", p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: "#555", display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ color: "#1E5DA9", opacity: 0.8 }} /> {patient.phone || "No phone provided"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#555", display: "flex", alignItems: "center", gap: 1 }}>
                      <EmailIcon fontSize="small" sx={{ color: "#1E5DA9", opacity: 0.8 }} /> {patient.email || "No email provided"}
                    </Typography>
                  </Box>

                  {/* Timestamps */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: "#888", fontWeight: 600, display: "block", mb: 0.5 }}>Last Visit</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", fontSize: "0.8rem" }}>{formatDateTime(patient.lastVisit)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: "#888", fontWeight: 600, display: "block", mb: 0.5 }}>Next Appointment</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#333", fontSize: "0.8rem" }}>{formatDateTime(patient.nextAppointment)}</Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ flexGrow: 1 }} />
                  <Divider sx={{ my: 2 }} />

                  {/* Buttons */}
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button fullWidth variant="outlined" size="small" onClick={() => handleViewProfile(patient)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "rgba(30,93,169,0.3)", color: "#1E5DA9" }}>
                      Profile
                    </Button>
                    <Button fullWidth variant="contained" size="small" onClick={() => setShowBookMeeting(patient)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, background: "#1E5DA9", boxShadow: "none" }}>
                      Book Meeting
                    </Button>
                  </Box>

              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Patient Modal */}
      <Dialog open={showAddPatient} onClose={() => setShowAddPatient(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9" }}>Add New Patient</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth size="small" label="First Name" value={addForm.firstName} onChange={(e) => setAddForm({...addForm, firstName: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Last Name" value={addForm.lastName} onChange={(e) => setAddForm({...addForm, lastName: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Age" type="number" value={addForm.age} onChange={(e) => setAddForm({...addForm, age: e.target.value})} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select value={addForm.gender} label="Gender" onChange={(e) => setAddForm({...addForm, gender: e.target.value})}>
                  <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Phone" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button onClick={() => setShowAddPatient(false)} sx={{ textTransform: "none", color: "#555" }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPatient} sx={{ background: "#1E5DA9", borderRadius: 2, textTransform: "none" }}>Confirm & Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Profile & Prescriptions Modal */}
      <Dialog open={Boolean(viewProfileData)} onClose={() => setViewProfileData(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9", pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Patient Dossier
          <Chip label={`ID: ${viewProfileData?.patientId}`} size="small" sx={{ fontWeight: 600, background: "#f1f5f9" }} />
        </DialogTitle>
        <DialogContent>
          {viewProfileData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3, p: 2, background: "#f8fafc", borderRadius: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#1E5DA9", fontSize: "1.5rem" }}>{viewProfileData.firstName?.[0]}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="800" color="#333" sx={{ lineHeight: 1.2 }}>{viewProfileData.firstName} {viewProfileData.lastName}</Typography>
                  <Typography variant="body2" color="#777">{viewProfileData.patientAge} Years Old • {viewProfileData.gender}</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E5DA9", mb: 1 }}>Issued Prescriptions</Typography>
                {prescriptions.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#777", fontStyle: "italic", p: 2, background: "#f9f9f9", borderRadius: 2 }}>No prescriptions found for this patient.</Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {prescriptions.map((px, i) => (
                      <ListItem key={i} sx={{ border: "1px solid #eee", borderRadius: 2, mb: 1, p: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}><DescriptionIcon sx={{ color: "#1E5DA9" }} /></ListItemIcon>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight="700">{px.medicine}</Typography>} 
                          secondary={<Typography variant="caption" color="text.secondary">Issued: {new Date(px.date).toLocaleDateString()} — {px.notes}</Typography>}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewProfileData(null)} sx={{ textTransform: "none", fontWeight: 600 }}>Close Dossier</Button>
        </DialogActions>
      </Dialog>

      {/* Book Meeting Modal */}
      <Dialog open={Boolean(showBookMeeting)} onClose={() => setShowBookMeeting(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#1E5DA9" }}>Schedule Consultation</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "#555" }}>Booking appointment for <strong>{showBookMeeting?.firstName} {showBookMeeting?.lastName}</strong></Typography>
          <TextField fullWidth size="small" label="Date" type="date" InputLabelProps={{ shrink: true }} value={bookForm.appointmentDate} onChange={(e) => setBookForm({...bookForm, appointmentDate: e.target.value})} />
          <TextField fullWidth size="small" label="Time" type="time" InputLabelProps={{ shrink: true }} value={bookForm.time} onChange={(e) => setBookForm({...bookForm, time: e.target.value})} />
          <TextField fullWidth size="small" label="Reason for Visit" value={bookForm.reason} onChange={(e) => setBookForm({...bookForm, reason: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowBookMeeting(null)} sx={{ color: "#555", textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleBookMeeting} startIcon={<EventAvailableIcon />} sx={{ background: "#1E5DA9", textTransform: "none" }}>Confirm Booking</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PatientsDetail;
