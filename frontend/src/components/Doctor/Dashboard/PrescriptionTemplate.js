import React from "react";
import { Box, Typography, Paper, Grid, Divider, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableContainer } from "@mui/material";

const PrescriptionTemplate = ({ prescription }) => {

  const colors = {
    primary: "#1976d2",
    secondary: "#26a69a",
    background: "#f4f7fb",
    card: "#ffffff"
  };

  if (!prescription) return null;

  return (
    <Box id="prescription-template-doc" sx={{ background: colors.background, padding: 2, minHeight: "100%" }}>
      <Paper elevation={0} sx={{ padding: 3, borderRadius: 2, background: colors.card, border: "1px solid #eee" }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color={colors.primary}>
              AidME Healthcare
            </Typography>
            <Typography variant="body2">Digital E-Prescription</Typography>
          </Box>

          <Chip label="Verified Prescription" color="success" />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Doctor & Patient */}
        <Grid container spacing={3}>
          {/* Patient Section */}
          <Grid item xs={8}>
            <Typography variant="h6" sx={{ color: colors.primary, fontWeight: 800, borderBottom: `2px solid ${colors.background}`, pb: 0.5, mb: 2, display: 'inline-block', fontSize: '1.15rem' }}>
              Patient Particulars
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#777", minWidth: 60 }}>Name:</Typography>
                <Typography variant="h5" fontWeight="800" sx={{ color: "#222", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {prescription.patient && prescription.patient !== "N/A" ? prescription.patient : "[DATA NOT PROVIDED]"}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#777" }}>Patient ID:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: colors.primary }}>#{prescription.patientId || "N/A"}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#777" }}>Age:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: "#333" }}>{prescription.age || "N/A"}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#777" }}>Gender:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: "#333", textTransform: 'capitalize' }}>{prescription.gender || "N/A"}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Verification Section */}
          <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, background: "#f9f9f9", borderRadius: 2, border: "1px solid #eee" }}>
              <Box 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  border: "1px dashed #ccc", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: "#fff",
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" align="center" sx={{ fontSize: '0.5rem', color: '#999', fontWeight: 'bold' }}>
                  SECURE<br/>QR
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                Scan to verify<br/>authenticity
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        {/* Diagnosis */}
        <Typography variant="h6" color={colors.secondary}>
          Diagnosis
        </Typography>
        <Typography sx={{ mb: 1.5 }}>{prescription.diagnosis || "General Consultation"}</Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Medicines Table */}
        <Typography variant="h6" color={colors.secondary}>
          Prescription Medicines
        </Typography>

        <TableContainer component={Box} sx={{ mt: 1, mb: 1 }}>
          <Table size="small" sx={{ minWidth: 500 }}>
            <TableHead sx={{ background: "#e3f2fd" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Medicine</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Dosage</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Instructions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(prescription.medicines || []).map((med, index) => (
                <TableRow key={index} hover>
                  <TableCell>{med.name}</TableCell>
                  <TableCell>{med.dosage}</TableCell>
                  <TableCell>{med.frequency}</TableCell>
                  <TableCell>{med.duration}</TableCell>
                  <TableCell>{med.note}</TableCell>
                </TableRow>
              ))}
              {(!prescription.medicines || prescription.medicines.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: "gray", py: 2 }}>
                    No medicines prescribed.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 1.5 }} />

        {/* Guidelines */}
        <Typography variant="h6" color={colors.secondary}>
          Guidelines
        </Typography>

        <ul style={{ paddingLeft: "20px", marginTop: "8px", marginBottom: "8px" }}>
          {(prescription.guidelines || []).map((g, i) => (
            <li key={i}>{g}</li>
          ))}
          {(!prescription.guidelines || prescription.guidelines.length === 0) && (
            <li>No special guidelines provided.</li>
          )}
        </ul>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mt: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Next Appointment: <Typography component="span" color="primary">{prescription.nextVisit || "Not Scheduled"}</Typography>
          </Typography>

          <Box sx={{ textAlign: "right", pt: 1, minWidth: 150 }}>
            <Box sx={{ borderBottom: "1px solid #333", display: 'inline-block', minWidth: 120, mb: 0.5 }}>
              <Typography sx={{ fontFamily: '"Brush Script MT", cursive', fontSize: '1.4rem', color: '#1a237e' }}>
                Dr. {prescription.doctor}
              </Typography>
            </Box>
            <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Digital Signature</Typography>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem' }}>Electronically Verified</Typography>
          </Box>
        </Box>

      </Paper>
    </Box>
  );
};

export default PrescriptionTemplate;
