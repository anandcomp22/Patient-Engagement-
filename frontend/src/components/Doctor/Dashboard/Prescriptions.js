import React, { useState, useEffect, useRef } from "react";
import { 
  Box, Typography, Button, Paper, Grid, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, TextField, Tabs, Tab, IconButton, Divider, Chip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";
import PrescriptionTemplate from "./PrescriptionTemplate";
import MedicalReportTemplate from "./MedicalReportTemplate";
import html2pdf from "html2pdf.js";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Prescriptions = () => {
  const [patients, setPatients] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // History State
  const [pastPrescriptions, setPastPrescriptions] = useState([]);
  const [selectedPastRx, setSelectedPastRx] = useState(null);

  // Form State for Prescribing
  const [diagnosis, setDiagnosis] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [dynamicMedicines, setDynamicMedicines] = useState([
    { name: "", dosage: "", frequency: "", duration: "", note: "" }
  ]);

  const printRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [resPatients, resApps] = await Promise.all([
          axios.get(`${API_BASE}/doctor/patients`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/appointment/app`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const uniquePatients = Array.from(new Map(resPatients.data.map(p => [p.patientId, p])).values());
        setPatients(uniquePatients);
        setAllAppointments(resApps.data);
      } catch (err) {
        console.error("Failed to load clinical data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      const fetchHistory = async () => {
        try {
          const fullName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
          const res = await axios.get(`${API_BASE}/prescriptions/patient/${encodeURIComponent(fullName)}`);
          setPastPrescriptions(res.data || []);
        } catch (err) {
          console.error("Failed to load historical prescriptions", err);
        }
      };
      fetchHistory();
    } else {
      setPastPrescriptions([]);
      setSelectedPastRx(null);
    }
  }, [selectedPatient]);

  const handleAddMedicine = () => {
    setDynamicMedicines([...dynamicMedicines, { name: "", dosage: "", frequency: "", duration: "", note: "" }]);
  };

  const handleRemoveMedicine = (index) => {
    setDynamicMedicines(dynamicMedicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...dynamicMedicines];
    updated[index][field] = value;
    setDynamicMedicines(updated);
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) return;
    try {
      const payload = {
        patientId: selectedPatient.patientId, // Passed to fix the hardcoded 202 bug
        patient: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.patientAge || "N/A",
        address: "Hospital Database",
        contact: selectedPatient.phone || "N/A",
        prescriptionNo: `RX-${Math.floor(Math.random() * 900000)}`,
        date: new Date().toISOString().split("T")[0],
        email: selectedPatient.email || "no-reply@clinic.com",
        medicines: dynamicMedicines.filter(m => m.name.trim() !== ""),
        notes: diagnosis + " | " + guidelines
      };

      await axios.post(`${API_BASE}/prescriptions/generate`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      const element = document.getElementById("prescription-template-doc");
      if (element) {
        const filename = `prescription_${payload.patient.replace(/\s+/g, "_")}.pdf`;
        const pdfBlob = await html2pdf().set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).outputPdf('blob');
        const formData = new FormData();
        formData.append("prescriptionPdf", pdfBlob, filename);
        await axios.post(`${API_BASE}/prescriptions/uploadPdf`, formData, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      }

      alert("Prescription securely saved and generated.");
    } catch (err) {
      console.error(err);
      alert("Failed to save prescription. Check console.");
    }
  };

  const handleDownload = async () => {
    if (!selectedPatient) return;
    const name = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
    const filename = `prescription_${name.replace(/\s+/g, "_")}.pdf`;
    const element = document.getElementById("prescription-template-doc");
    if (!element) return;
    try {
      await html2pdf().set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).save();
    } catch (e) { alert("Error downloading directly from UI"); }
  };

  const handleSendEmail = () => {
    if (!selectedPatient?.email) {
      alert("No email address found for this patient.");
      return;
    }
    const name = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
    const filename = `prescription_${name.replace(/\s+/g, "_")}.pdf`;
    
    axios.post(`${API_BASE}/prescriptions/send`, { 
      email: selectedPatient.email, file: filename 
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(() => alert(`Email securely sent to ${selectedPatient.email}!`))
      .catch(() => alert("Error sending email. Please Save Rx first!"));
  };

  const handlePrint = () => {
    window.print();
  };

  // Build the live preview data objects
  const doctorName = localStorage.getItem("doctorName") || "Doctor";
  
  // Decide whether to show Live Form Data OR Selected Historical Data
  const prescriptionPreviewData = selectedPatient 
    ? (selectedPastRx ? {
        doctor: doctorName,
        specialization: "General Medicine",
        license: "MED-CLINIC-X",
        patient: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.patientAge,
        gender: selectedPatient.gender,
        diagnosis: "Historical Record",
        medicines: [{ name: selectedPastRx.medicine, dosage: selectedPastRx.dosage || "", frequency: "", duration: "", note: "" }],
        guidelines: [selectedPastRx.notes],
        nextVisit: new Date(selectedPastRx.date).toLocaleDateString()
      } : {
        doctor: doctorName,
        specialization: "General Medicine",
        license: "MED-CLINIC-X",
        patient: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.patientAge,
        gender: selectedPatient.gender,
        diagnosis: diagnosis,
        medicines: dynamicMedicines.filter(m => m.name.trim() !== ""),
        guidelines: guidelines.split("\n").filter(g => g.trim() !== ""),
        nextVisit: selectedPatient.nextAppointment ? new Date(selectedPatient.nextAppointment).toLocaleDateString() : "TBD"
      })
    : null;

  const patientAppointments = selectedPatient
    ? allAppointments.filter(a => Number(a.patientId) === Number(selectedPatient.patientId))
    : [];

  const medicalReportData = selectedPatient ? {
    name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
    age: selectedPatient.patientAge,
    gender: selectedPatient.gender,
    patientId: selectedPatient.patientId,
    bloodGroup: "Not Recorded", // Assuming not explicitly in schema
    allergies: selectedPatient.conditions?.join(", ") || "None recorded",
    history: patientAppointments.map(a => ({
      date: new Date(a.appointmentDate).toISOString().split("T")[0],
      doctor: a.doctorName || doctorName,
      diagnosis: a.reason || "General Checkup",
      treatment: a.appstatus || "Consulted"
    })),
    remarks: `Patient has ${patientAppointments.length} recorded visits in the timeline. Maintenance and regular checks requested.`
  } : null;

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, height: "88vh", display: "flex", flexDirection: "column" }}>
      <Typography variant="h5" fontWeight="800" color="#1E5DA9" sx={{ mb: 2, "@media print": { display: "none" } }}>
        Clinical Prescribing & Reporting Hub
      </Typography>

      <Grid container spacing={3} sx={{ flexGrow: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Patients List */}
        <Grid item xs={3} sx={{ height: "100%", display: "flex", flexDirection: "column", "@media print": { display: "none" } }}>
          <Paper sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <TextField
              size="small" fullWidth placeholder="Search Patient..." variant="outlined"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ color: "#aaa", mr: 1 }} /> }}
              sx={{ mb: 2 }}
            />
            <List sx={{ overflowY: "auto", flexGrow: 1 }}>
              {filteredPatients.map(p => (
                <ListItem 
                  button key={p.patientId} 
                  onClick={() => setSelectedPatient(p)}
                  sx={{ 
                    borderRadius: 2, mb: 1, 
                    background: selectedPatient?.patientId === p.patientId ? "#E3F2FD" : "transparent",
                    border: selectedPatient?.patientId === p.patientId ? "1px solid #1E5DA9" : "1px solid transparent"
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ background: "linear-gradient(135deg, #1E5DA9, #62b8ffff)", color: "#fff", fontWeight: 700 }}>
                      {(p.firstName || "P")[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={`${p.firstName} ${p.lastName}`} secondary={`ID: ${p.patientId}`} primaryTypographyProps={{ fontWeight: 600, color: "#333" }} />
                </ListItem>
              ))}
              {filteredPatients.length === 0 && (
                <Typography variant="body2" align="center" color="#888" sx={{ mt: 4 }}>No patients found.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right Workspace */}
        <Grid item xs={9} sx={{ height: "100%", display: "flex", flexDirection: "column", "@media print": { width: "100%", flexBasis: "100%", maxWidth: "100%" } }}>
          {!selectedPatient ? (
            <Paper sx={{ flexGrow: 1, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", "@media print": { display: "none" } }}>
              <Box textAlign="center">
                <Avatar sx={{ width: 80, height: 80, bgcolor: "#E3F2FD", color: "#1E5DA9", mx: "auto", mb: 2, fontSize: "2rem" }}>🩺</Avatar>
                <Typography variant="h6" fontWeight="700" color="#555">Select a Patient to begin</Typography>
                <Typography variant="body2" color="#888">Choose from the directory to write prescriptions or view records.</Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ flexGrow: 1, display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", background: "#fafafa", "@media print": { display: "none" } }}>
                <Tabs value={activeTab} onChange={(e, val) => { setActiveTab(val); setSelectedPastRx(null); }} textColor="primary" indicatorColor="primary">
                  <Tab label="Write E-Prescription" sx={{ fontWeight: 600, textTransform: "none" }} />
                  <Tab label="Historical Prescriptions" sx={{ fontWeight: 600, textTransform: "none" }} />
                  <Tab label="Monthly Medical Report" sx={{ fontWeight: 600, textTransform: "none" }} />
                </Tabs>
              </Box>

              {/* Dynamic Content Space */}
              <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }} ref={printRef}>
                
                {/* E-PRESCRIPTION VIEW */}
                {activeTab === 0 && (
                  <Grid container sx={{ width: "100%", height: "100%" }}>
                    
                    {/* Input Form Column (Conditionally Rendered/Shrunk) */}
                    {isFormOpen && (
                      <Grid item xs={5} sx={{ p: 3, borderRight: "1px solid #eee", overflowY: "auto", background: "#fff", "@media print": { display: "none" }, transition: "all 0.3s ease" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
                          <Typography variant="subtitle1" fontWeight="800" color="#1E5DA9">Rx Builder</Typography>
                          <Box>
                            <Chip label={`Selected: ${selectedPatient.firstName}`} size="small" sx={{ fontWeight: 600, mr: 1 }} />
                            <IconButton size="small" onClick={() => setIsFormOpen(false)} title="Shrink Form"><CloseFullscreenIcon fontSize="small" sx={{ color: "#888" }}/></IconButton>
                          </Box>
                        </Box>
                      
                      <TextField fullWidth size="small" label="Primary Diagnosis" sx={{ mb: 3 }} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                      
                      <Typography variant="caption" fontWeight="bold" color="#888" sx={{ mb: 1, display: "block" }}>MEDICATIONS</Typography>
                      {dynamicMedicines.map((med, i) => (
                        <Box key={i} sx={{ border: "1px solid #e0e0e0", p: 1.5, borderRadius: 2, mb: 1.5, background: "#fafafa", position: "relative" }}>
                          <Grid container spacing={1}>
                            <Grid item xs={12}><TextField fullWidth size="small" placeholder="Medicine Name (e.g. Amoxicillin)" value={med.name} onChange={e => handleMedicineChange(i, "name", e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField fullWidth size="small" placeholder="Dosage (500mg)" value={med.dosage} onChange={e => handleMedicineChange(i, "dosage", e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField fullWidth size="small" placeholder="Freq (1-0-1)" value={med.frequency} onChange={e => handleMedicineChange(i, "frequency", e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField fullWidth size="small" placeholder="Duration (5 days)" value={med.duration} onChange={e => handleMedicineChange(i, "duration", e.target.value)} /></Grid>
                            <Grid item xs={6}><TextField fullWidth size="small" placeholder="Notes (After food)" value={med.note} onChange={e => handleMedicineChange(i, "note", e.target.value)} /></Grid>
                          </Grid>
                          {dynamicMedicines.length > 1 && (
                            <IconButton size="small" sx={{ position: "absolute", top: -10, right: -10, background: "#fff", border: "1px solid #ccc", boxShadow: 1 }} color="error" onClick={() => handleRemoveMedicine(i)}>
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ))}
                      <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddMedicine} size="small" sx={{ mb: 3, textTransform: "none", fontWeight: 600 }}>Add Another Medicine</Button>

                      <TextField fullWidth multiline rows={3} size="small" label="Guidelines & Advice (Line breaks allowed)" sx={{ mb: 3 }} value={guidelines} onChange={e => setGuidelines(e.target.value)} />

                      <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSavePrescription} sx={{ flexGrow: 1, fontWeight: 600, textTransform: "none", boxShadow: "none" }}>Save Rx</Button>
                        <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleDownload} sx={{ flexGrow: 1, fontWeight: 600, textTransform: "none" }}>Download</Button>
                        <Button variant="contained" color="secondary" startIcon={<EmailIcon />} onClick={handleSendEmail} sx={{ width: "100%", fontWeight: 600, textTransform: "none", background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "none" }}>Email to Patient</Button>
                        <Button fullWidth variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 600, textTransform: "none", color: "#555", borderColor: "#ccc" }}>Print</Button>
                      </Box>
                    </Grid>
                    )}

                    {/* Live Preview Column */}
                    <Grid item xs={isFormOpen ? 7 : 12} sx={{ height: "100%", overflowY: "auto", position: "relative", transition: "all 0.3s ease", background: "#f4f7fb" }}>
                      {!isFormOpen && (
                        <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 10, "@media print": { display: "none" } }}>
                          <Button variant="contained" size="small" onClick={() => setIsFormOpen(true)} startIcon={<OpenInFullIcon/>} sx={{ textTransform: "none", fontWeight: 600, background: "#1E5DA9", boxShadow: "0 4px 12px rgba(30,93,169,0.3)" }}>
                            Open Builder
                          </Button>
                        </Box>
                      )}
                      {/* We center the template if form is shrunk so it doesn't look stretched absurdly */}
                      <Box sx={{ maxWidth: isFormOpen ? "100%" : 850, mx: "auto", height: "100%" }}>
                        <PrescriptionTemplate prescription={prescriptionPreviewData} />
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* HISTORICAL PRESCRIPTIONS TAB */}
                {activeTab === 1 && (
                  <Grid container sx={{ width: "100%", height: "100%" }}>
                    <Grid item xs={4} sx={{ p: 2, borderRight: "1px solid #eee", overflowY: "auto", background: "#fff", "@media print": { display: "none" } }}>
                      <Typography variant="subtitle1" fontWeight="800" color="#1E5DA9" sx={{ mb: 2 }}>Prescription Archive</Typography>
                      {pastPrescriptions.length === 0 ? (
                        <Typography variant="body2" color="#888">No historical prescriptions found for {selectedPatient.firstName}.</Typography>
                      ) : (
                        <List sx={{ p: 0 }}>
                          {pastPrescriptions.map(rx => (
                            <ListItem key={rx._id} sx={{ mb: 1.5, p: 2, border: "1px solid #eee", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "flex-start", background: selectedPastRx?._id === rx._id ? "#F3F8FF" : "#fafafa", transition: "all 0.2s", cursor: "pointer", "&:hover": { borderColor: "#1E5DA9" } }} onClick={() => setSelectedPastRx(rx)}>
                              <Typography variant="caption" fontWeight="bold" color="#1E5DA9">{new Date(rx.date).toLocaleDateString()}</Typography>
                              <Typography variant="body2" sx={{ my: 0.5, fontWeight: 600 }}>{rx.medicine}</Typography>
                              <Button size="small" startIcon={<VisibilityIcon />} sx={{ mt: 1, textTransform: "none" }}>Reconstruct & View</Button>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Grid>
                    <Grid item xs={8} sx={{ height: "100%", overflowY: "auto", background: "#f4f7fb", position: "relative" }}>
                      {selectedPastRx ? (
                        <Box sx={{ maxWidth: 850, mx: "auto", pb: 6 }}>
                          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 2, "@media print": { display: "none" } }}>
                            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ background: "#1E5DA9", textTransform: "none", mr: 1 }}>Print Record</Button>
                          </Box>
                          <PrescriptionTemplate prescription={prescriptionPreviewData} />
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888", flexDirection: "column", gap: 2, "@media print": { display: "none" } }}>
                          <HistoryIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                          <Typography>Select a past record to visually reconstruct it.</Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* MEDICAL REPORT VIEW */}
                {activeTab === 2 && (
                  <Box sx={{ width: "100%", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2, background: "#f8fafc", borderBottom: "1px solid #eee", "@media print": { display: "none" } }}>
                      <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ textTransform: "none", fontWeight: 600, background: "#1565c0" }}>Print Medical Record</Button>
                    </Box>
                    <Box sx={{ flexGrow: 1, background: "#eef2f6", p: 2 }}>
                      {/* Encase in a maxWidth container so it prints like an A4 sheet */}
                      <Box sx={{ maxWidth: 850, mx: "auto" }}>
                        <MedicalReportTemplate report={medicalReportData} />
                      </Box>
                    </Box>
                  </Box>
                )}

              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Prescriptions;
