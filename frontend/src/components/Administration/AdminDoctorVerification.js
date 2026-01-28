import React, { useEffect, useState } from "react";
import {
  Grid, Paper, Typography, Box, Button, Chip
} from "@mui/material";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const AdminDoctorVerification = () => {
  const [doctors, setDoctors] = useState([]);

  const authHeader = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  const fetchDoctors = async () => {
    const res = await axios.get(`${API_BASE}/admin/doctors`, authHeader);
    setDoctors(res.data);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const updateStatus = async (id, action) => {
    await axios.patch(`${API_BASE}/admin/doctors/${id}/${action}`, {}, authHeader);
    fetchDoctors();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: "#1E5DA9" }}>
        Doctor Verification
      </Typography>

      <Grid container spacing={3}>
        {doctors.map((doc) => (
          <Grid item xs={12} md={6} key={doc._id}>
            <Paper className="section-box">
              <Typography fontWeight="bold">
                Dr. {doc.firstName} {doc.lastName}
              </Typography>

              <Typography>Email: {doc.email}</Typography>
              <Typography>Specialty: {doc.specialty}</Typography>
              <Typography>License: {doc.licenseNumber}</Typography>

              <Box sx={{ mt: 1 }}>
                <Chip
                  label={doc.verificationStatus}
                  color={
                    doc.verificationStatus === "verified" ? "success" :
                    doc.verificationStatus === "rejected" ? "error" : "warning"
                  }
                />
              </Box>

              {doc.verificationStatus === "pending" && (
                <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => updateStatus(doc._id, "verify")}
                  >
                    Verify
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => updateStatus(doc._id, "reject")}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDoctorVerification;
