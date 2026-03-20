import React from "react";
import { Box, Typography, Paper, Grid, Divider, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";

const MedicalReportTemplate = ({ report }) => {

  const colors = {
    primary: "#1565c0",
    secondary: "#00897b",
    background: "#f4f7fb"
  };

  if (!report) return null;

  return (
    <Box sx={{ background: colors.background, padding: 4, height: "100%" }}>
      <Paper elevation={4} sx={{ padding: 4, borderRadius: 3 }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4" color={colors.primary} fontWeight="bold">
            Patient Monthly Medical Report
          </Typography>
          <Chip label="Secure Record" color="primary" />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Patient Info */}
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography fontWeight="bold" color="text.secondary" variant="caption">PATIENT NAME</Typography>
            <Typography variant="h6">{report.name || "Unknown"}</Typography>

            <Typography fontWeight="bold" color="text.secondary" variant="caption" sx={{ mt: 1, display: "block" }}>AGE / GENDER</Typography>
            <Typography>{report.age || "N/A"} / {report.gender || "N/A"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography fontWeight="bold" color="text.secondary" variant="caption">PATIENT ID</Typography>
            <Typography variant="h6">{report.patientId || "N/A"}</Typography>

            <Typography fontWeight="bold" color="text.secondary" variant="caption" sx={{ mt: 1, display: "block" }}>BLOOD GROUP</Typography>
            <Typography>{report.bloodGroup || "O+"}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Appointment History */}
        <Typography variant="h6" color={colors.secondary} sx={{ mb: 2 }}>
          Recent Appointment History
        </Typography>

        <Table size="small">
          <TableHead sx={{ background: "#e0f2f1" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Doctor</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Reason / Diagnosis</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>State / Treatment</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {(report.history || []).map((item, index) => (
              <TableRow key={index} hover>
                <TableCell>{item.date}</TableCell>
                <TableCell>Dr. {item.doctor}</TableCell>
                <TableCell>{item.diagnosis || item.reason}</TableCell>
                <TableCell>{item.treatment || item.status}</TableCell>
              </TableRow>
            ))}
            {(!report.history || report.history.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: "gray" }}>No recent history recorded.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Divider sx={{ my: 3 }} />

        {/* Medical History */}
        <Typography variant="h6" color={colors.secondary} sx={{ mb: 1 }}>
          Clinical Vitals & Medical History
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, background: "#f8f9fa", border: "1px solid #eee" }}>
              <Typography color="error" fontWeight="bold">Allergies</Typography>
              <Typography variant="body2">{report.allergies || "None Reported"}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, background: "#f8f9fa", border: "1px solid #eee" }}>
              <Typography color="warning.main" fontWeight="bold">Chronic Diseases</Typography>
              <Typography variant="body2">{report.chronic || "None Reported"}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, background: "#f8f9fa", border: "1px solid #eee" }}>
              <Typography color="info.main" fontWeight="bold">Past Surgeries</Typography>
              <Typography variant="body2">{report.surgeries || "None Reported"}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" color={colors.secondary}>
          Physician Remarks
        </Typography>

        <Typography sx={{ background: "#fffde7", p: 2, borderLeft: "4px solid #fbc02d", mt: 1 }}>
          {report.remarks || "Patient is in stable condition. Continue basic medical observances."}
        </Typography>

      </Paper>
    </Box>
  );
};

export default MedicalReportTemplate;
