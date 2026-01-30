import React, { useEffect, useState } from "react";
import {
  Grid, Paper, Typography, Box, Button, Chip, Tabs, Tab, Stack, Divider
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
  const [doctors, setDoctors] = useState(DUMMY_DOCTORS);
  const [tab, setTab] = useState(0);
  const USE_DUMMY = true;
  const theme = useTheme();

  const authHeader = {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/verify`, authHeader);
      setDoctors(res.data);
    } catch (error) {
      console.warn("API not ready, loading dummy data");
      setDoctors(DUMMY_DOCTORS);
    }
  };


  useEffect(() => {
    if (USE_DUMMY) {
      setDoctors(DUMMY_DOCTORS);
    } else {
      fetchDoctors();
    }
  }, []);


  const updateStatus = async (id, action) => {
    await axios.patch(`${API_BASE}/admin/verify/${id}/${action}`, {}, authHeader);
    fetchDoctors();
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

            {showActions && (
              <>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: 3 }}
                    onClick={() => updateStatus(doc._id, "verify")}
                  >
                    Verify
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    sx={{ borderRadius: 3 }}
                    onClick={() => updateStatus(doc._id, "reject")}
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
          {filteredDoctors("pending").length === 0 ? (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                }}
              >
                <HourglassTopIcon
                  sx={{ fontSize: 40, color: "warning.main" }}
                />
                <Typography fontWeight={600} mt={1}>
                  No pending verification requests
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredDoctors("pending").map((doc) =>
              renderDoctorCard(doc, true)
            )
          )}
        </Grid>
      )}


      {/* VERIFIED */}
      {tab === 1 && (
        <Grid container spacing={3}>
          {filteredDoctors("verified").length === 0 ? (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                }}
              >
                <VerifiedIcon sx={{ fontSize: 40, color: "success.main" }} />
                <Typography fontWeight={600} mt={1}>
                  No verified doctors
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredDoctors("verified").map((doc) =>
              renderDoctorCard(doc)
            )
          )}
        </Grid>
      )}

      {/* REJECTED */}
      {tab === 2 && (
        <Grid container spacing={3}>
          {filteredDoctors("rejected").length === 0 ? (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                }}
              >
                <CancelIcon sx={{ fontSize: 40, color: "error.main" }} />
                <Typography fontWeight={600} mt={1}>
                  No rejected doctors
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredDoctors("rejected").map((doc) =>
              renderDoctorCard(doc)
            )
          )}
        </Grid>
      )}
    </Box>
  );
};

export default AdminDoctorVerification;