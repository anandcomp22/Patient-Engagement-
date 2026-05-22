import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from "@mui/material";
import {
  Description as RxIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  CalendarToday,
  Person,
  MedicalServices,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import PrescriptionTemplate from "../../Doctor/Dashboard/PrescriptionTemplate";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const patientId = localStorage.getItem("patientId") || 123;

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/prescriptions/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPrescriptions(res.data);
      } catch (err) {
        console.error("Error fetching prescriptions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [patientId]);

  const handleOpenPreview = (rx) => {
    setSelectedRx(rx);
    setPreviewOpen(true);
  };

  const handleDownload = (filename) => {
    if (!filename) {
        alert("PDF not available for download.");
        return;
    }
    window.open(`${API_BASE}/prescriptions/download/${filename}`, '_blank');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: 2 }}>
        <RxIcon sx={{ fontSize: 40, color: "#1E5DA9" }} />
        My Prescriptions
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : prescriptions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 4, bgcolor: "#fff", border: "1px solid #e2e8f0" }}>
          <HistoryIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#94a3b8" }}>No prescriptions found yet</Typography>
          <Typography variant="body2" sx={{ color: "#cbd5e1" }}>Your medical records will appear here after a consultation.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {prescriptions.map((rx, index) => (
              <Grid item xs={12} key={rx._id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card sx={{ 
                    borderRadius: 4, 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    border: "1px solid #f1f5f9",
                    transition: "all 0.3s ease",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 18, color: "#64748b" }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475569" }}>
                                {new Date(rx.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                         </Box>
                         <Chip 
                            label={rx.diagnosis || "General Consultation"} 
                            size="small" 
                            sx={{ bgcolor: "#E3F2FD", color: "#1E5DA9", fontWeight: 700 }} 
                         />
                      </Box>
                      
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">DOCTOR</Typography>
                                <Typography variant="body1" fontWeight={600}>Dr. {rx.doctorName || "AidME Specialist"}</Typography>{/* Doctor Name needs to be in Prescription Schema or join */}
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" color="text.secondary">MEDICATIONS</Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {rx.medicines?.length > 0 ? rx.medicines.map(m => m.name).join(", ") : "View Details"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4} sx={{ display: "flex", justifyContent: { md: "flex-end" }, alignItems: "center", gap: 1 }}>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<ViewIcon />} 
                                    onClick={() => handleOpenPreview(rx)}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                                >
                                    View Digital Copy
                                </Button>
                                <Button 
                                    variant="contained" 
                                    startIcon={<DownloadIcon />} 
                                    onClick={() => handleDownload(rx.secureId ? `prescription_${rx.patientName.replace(/\s+/g, "_")}.pdf` : null)}
                                    sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#1E5DA9", fontWeight: 600 }}
                                >
                                    Download PDF
                                </Button>
                            </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Reconstructed Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, bgcolor: "#f8fafc" } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
           <Typography variant="h6" fontWeight={800} color="#1E5DA9">Digital Prescription Preview</Typography>
           <IconButton onClick={() => setPreviewOpen(false)}><ViewIcon sx={{ transform: "rotate(180deg)" }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
            {selectedRx && (
                <Box sx={{ p: 2 }}>
                    <PrescriptionTemplate 
                        prescription={{
                            ...selectedRx,
                            patient: selectedRx.patientName,
                            doctor: "Dr. Recorded",
                            nextVisit: selectedRx.nextVisit || "TBD",
                            guidelines: selectedRx.guidelines || []
                        }} 
                    />
                </Box>
            )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientPrescriptions;
