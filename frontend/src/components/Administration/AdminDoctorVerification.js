import React, { useEffect, useState } from "react";
import {
  CircularProgress ,Grid, Paper, Typography, Box, Button, Chip, Tabs, Tab, Stack, Divider
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EmailIcon from "@mui/icons-material/Email";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import BadgeIcon from "@mui/icons-material/Badge";

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const DUMMY_DOCTORS = [
  {
    _id: "1",
    firstName: "Amit",
    lastName: "Sharma",
    email: "amit.sharma@hospital.com",
    specialty: "Cardiologist",
    licenseNumber: "MH-CARD-1023",
    verificationStatus: "pending",
  },
  {
    _id: "2",
    firstName: "Neha",
    lastName: "Verma",
    email: "neha.verma@clinic.com",
    specialty: "Dermatologist",
    licenseNumber: "MH-DERM-2211",
    verificationStatus: "verified",
  },
  {
    _id: "3",
    firstName: "Rahul",
    lastName: "Patil",
    email: "rahul.patil@healthcare.com",
    specialty: "Orthopedic",
    licenseNumber: "MH-ORTH-7788",
    verificationStatus: "rejected",
  },
  {
    _id: "4",
    firstName: "Sneha",
    lastName: "Kulkarni",
    email: "sneha.k@medicenter.com",
    specialty: "Pediatrician",
    licenseNumber: "MH-PED-3344",
    verificationStatus: "pending",
  },
];


const AdminDoctorVerification = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const theme = useTheme();

  const authHeader = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);  // start loading
      const res = await axios.get(`${API_BASE}/admin/verify`, authHeader);
      setDoctors(res.data || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false); // stop loading
    }
  };


  useEffect(() => {
    fetchDoctors();
    const interval = setInterval(fetchDoctors, 100000);
    return () => clearInterval(interval);
  }, []);


  const handleVerify = async (doctorId) => {
    try {
      await axios.patch(
      `${API_BASE}/admin/verify/${doctorId}/verify`,
      { status: "verified" },
      authHeader
    );
      alert("Doctor verified successfully");
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert("Verification failed");
    }
  };

  const handleReject = async (doctorId) => {
    try {
      await axios.patch(
      `${API_BASE}/admin/verify/${doctorId}/verify`,
      { status: "rejected" },
      authHeader
    );
      alert("Doctor rejected");
      fetchDoctors();
    } catch (err) {
      console.error(err);
      alert("Rejection failed");
    }
  };

    const renderEmptyMessage = (status) => {
    const messages = {
      pending: "No pending verification requests at the moment. All doctors are up to date.",
      verified: "No verified doctors yet.",
      rejected: "No doctors have been rejected.",
    };

    const icons = {
      pending: <HourglassTopIcon sx={{ fontSize: 50, color: "warning.main" }} />,
      verified: <VerifiedIcon sx={{ fontSize: 50, color: "success.main" }} />,
      rejected: <CancelIcon sx={{ fontSize: 50, color: "error.main" }} />,
    };

    const colors = {
      pending: "warning.main",
      verified: "success.main",
      rejected: "error.main",
    };

    return (
      <Grid item xs={12}>
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: alpha(theme.palette[colors[status].split(".")[0]].main, 0.1),
          }}
        >
          {icons[status]}
          <Typography variant="h6" fontWeight={600} mt={2}>
            {messages[status]}
          </Typography>
        </Paper>
      </Grid>
    );
  };

  const filteredDoctors = (status) =>
    doctors.filter((d) => d.verificationStatus === status);


    const statusConfig = {
  pending: {
    color: theme.palette.warning.main,
    icon: <HourglassTopIcon fontSize="small" />,
  },
  verified: {
    color: theme.palette.success.main,
    icon: <VerifiedIcon fontSize="small" />,
  },
  rejected: {
    color: theme.palette.error.main,
    icon: <CancelIcon fontSize="small" />,
  },
};

  const renderDoctorCard = (doc, showActions = false) => {
    const status = statusConfig[doc.verificationStatus];

    return (
      <Grid item xs={12} md={6} lg={4} key={doc._id}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 4,
            backdropFilter: "blur(10px)",
            background:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.7)
                : alpha("#ffffff", 0.9),
            border: `1px solid ${alpha(status.color, 0.4)}`,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: `0 12px 30px ${alpha(status.color, 0.25)}`,
            },
          }}
        >
          <Stack spacing={1.2}>
            <Stack direction="row" justifyContent="space-between">
              

              <Chip
                icon={status.icon}
                label={doc.verificationStatus.toUpperCase()}
                sx={{
                  bgcolor: alpha(status.color, 0.15),
                  color: status.color,
                  fontWeight: 600,
                }}
              />
            </Stack>

            <Stack spacing={0.8}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">{doc.email}</Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeIcon fontSize="small" color="action" />
                <Typography variant="body2">{doc.licenseNumber}</Typography>
              </Stack>
              

            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={700}>
                Dr. {doc.firstName} {doc.lastName}
              </Typography>

              <Chip
                icon={status.icon}
                label={doc.verificationStatus.toUpperCase()}
                sx={{
                  bgcolor: alpha(status.color, 0.15),
                  color: status.color,
                  fontWeight: 600,
                }}
              />
            </Stack>

            <Chip
              icon={<MedicalServicesIcon />}
              label={doc.specialty}
              size="small"
              variant="outlined"
              sx={{
                width: "fit-content",
                borderColor: alpha(theme.palette.primary.main, 0.4),
                color: theme.palette.primary.main,
                fontWeight: 500,
              }}
            />
            {doc.licenseDocument && (
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={`http://localhost:8000/uploads/${doc.licenseDocument}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ borderRadius: 2 }}
              >
                View License
              </Button>
            )}


            {showActions && doc.verificationStatus === "pending" && (
              <>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: 3 }}
                    onClick={() => handleVerify(doc._id)}
                  >
                    Verify
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    sx={{ borderRadius: 3 }}
                    onClick={() => handleReject(doc._id)}
                  >
                    Reject
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg,
            ${alpha(theme.palette.primary.main, 0.85)},
            ${alpha(theme.palette.secondary.main, 0.85)})`,
          color: "#fff",
        }}
      >
        <Typography variant="h5" fontWeight={800}>
          Doctor Verification Panel
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Review and approve doctor credentials
        </Typography>
      </Box>


      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label={`Pending (${filteredDoctors("pending").length})`} />
        <Tab label={`Verified (${filteredDoctors("verified").length})`} />
        <Tab label={`Rejected (${filteredDoctors("rejected").length})`} />
      </Tabs>

      {/* PENDING */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {loading ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                <CircularProgress />
                <Typography mt={2}>Loading doctors...</Typography>
              </Paper>
            </Grid>
          ) : filteredDoctors("pending").length === 0 ? (
            renderEmptyMessage("pending")
          ) : (
            filteredDoctors("pending").map((doc) => renderDoctorCard(doc, true))
          )}
        </Grid>
      )}


      {/* VERIFIED */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {loading ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                <CircularProgress />
                <Typography mt={2}>Loading doctors...</Typography>
              </Paper>
            </Grid>
          ) : filteredDoctors("verified").length === 0 ? (
            renderEmptyMessage("verified")
          ) : (
            filteredDoctors("verified").map((doc) => renderDoctorCard(doc, false))
          )}

        </Grid>
      )}

      {/* REJECTED */}
      {tab === 2 && (
        <Grid container spacing={3}>
          {loading ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
                <CircularProgress />
                <Typography mt={2}>Loading doctors...</Typography>
              </Paper>
            </Grid>
          ) : filteredDoctors("rejected").length === 0 ? (
            renderEmptyMessage("rejected")
          ) : (
            filteredDoctors("rejected").map((doc) => renderDoctorCard(doc, false))
          )}

        </Grid>
      )}
    </Box>
  );
};

export default AdminDoctorVerification;