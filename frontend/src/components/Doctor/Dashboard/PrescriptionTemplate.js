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
          <Grid item xs={6}>
            <Typography variant="h6" color={colors.primary}>Doctor</Typography>
            <Typography>Dr. {prescription.doctor || "Unknown"}</Typography>
            <Typography variant="body2">{prescription.specialization || "General Physician"}</Typography>
            <Typography variant="body2">License: {prescription.license || "MD-100293"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="h6" color={colors.primary}>Patient</Typography>
            <Typography>{prescription.patient || "Unknown"}</Typography>
            <Typography variant="body2">Age: {prescription.age || "N/A"}</Typography>
            <Typography variant="body2">Gender: {prescription.gender || "N/A"}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5 }} />

        {/* Diagnosis */}
        <Typography variant="h6" color={colors.secondary}>
          Diagnosis
        </Typography>
        <Typography>{prescription.diagnosis || "General Checkup"}</Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Medicines Table */}
        <Typography variant="h6" color={colors.secondary}>
          Prescription Medicines
        </Typography>

        <TableContainer component={Box} sx={{ overflowX: "auto", mt: 1, mb: 1 }}>
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

        <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
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

          <Box sx={{ textAlign: "right", borderTop: "1px dashed #ccc", pt: 1, minWidth: 150 }}>
            <Typography fontWeight="bold" color={colors.primary} sx={{ fontSize: "1.1rem" }}>
              Dr. {prescription.doctor}
            </Typography>
            <Typography variant="caption" color="text.secondary">Digital Signature</Typography>
          </Box>
        </Box>

      </Paper>
    </Box>
  );
};

export default PrescriptionTemplate;
