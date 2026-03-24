import React, { useEffect, useState } from "react";
import {
  Box, Grid, Paper, Typography, Button, Chip, Tabs, Tab, Stack,
  Divider, CircularProgress, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EmailIcon from "@mui/icons-material/Email";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import BadgeIcon from "@mui/icons-material/Badge";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WorkIcon from "@mui/icons-material/Work";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminDoctorVerification = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [rejectDialog, setRejectDialog] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState("");
  const theme = useTheme();

  const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/verify`, authHeader);
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch doctors:", e);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    const interval = setInterval(fetchDoctors, 120000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const handleVerify = async (doctorId) => {
    try {
      await axios.patch(`${API}/admin/verify/${doctorId}/verify`, { status: "verified" }, authHeader);
      fetchDoctors();
    } catch (err) { console.error(err); }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    try {
      await axios.patch(`${API}/admin/verify/${rejectDialog}/verify`, { status: "rejected", reason: rejectReason }, authHeader);
      setRejectDialog(null);
      setRejectReason("");
      fetchDoctors();
    } catch (err) { console.error(err); }
  };

  const filtered = (status) => doctors.filter(d => d.verificationStatus === status);

  const statusConfig = {
    pending:  { color:"#f59e0b", bg:"#fef3c7", icon: <HourglassTopIcon sx={{ fontSize:14 }} /> },
    verified: { color:"#22c55e", bg:"#dcfce7", icon: <VerifiedIcon    sx={{ fontSize:14 }} /> },
    rejected: { color:"#ef4444", bg:"#fee2e2", icon: <CancelIcon       sx={{ fontSize:14 }} /> },
  };

  const renderEmpty = (status) => {
    const msgs = {
      pending:  { text:"No pending verifications. All doctors are reviewed." , icon:<HourglassTopIcon sx={{ fontSize:52, color:"#f59e0b" }} /> },
      verified: { text:"No verified doctors yet.",                            icon:<VerifiedIcon    sx={{ fontSize:52, color:"#22c55e" }} /> },
      rejected: { text:"No doctors have been rejected.",                      icon:<CancelIcon       sx={{ fontSize:52, color:"#ef4444" }} /> },
    };
    return (
      <Grid item xs={12}>
        <Paper sx={{ p:5, textAlign:"center", borderRadius:"20px", bgcolor:"#f8fafc" }}>
          {msgs[status].icon}
          <Typography variant="h6" fontWeight={600} mt={2} color="text.secondary">{msgs[status].text}</Typography>
        </Paper>
      </Grid>
    );
  };

  const renderCard = (doc, showActions = false) => {
    const sc = statusConfig[doc.verificationStatus] || statusConfig.pending;
    return (
      <Grid item xs={12} md={6} lg={4} key={doc._id}>
        <Paper sx={{
          p:2.5, borderRadius:"20px",
          border:`1.5px solid ${alpha(sc.color, 0.3)}`,
          boxShadow:`0 4px 20px ${alpha(sc.color, 0.08)}`,
          transition:"all 0.3s ease",
          "&:hover": { transform:"translateY(-6px)", boxShadow:`0 12px 32px ${alpha(sc.color, 0.18)}` }
        }}>
          <Stack spacing={1.5}>
            {/* Avatar + Name */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width:48, height:48, bgcolor:alpha(sc.color, 0.15), color:sc.color, fontWeight:800, fontSize:18 }}>
                {doc.firstName?.[0]}{doc.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography fontWeight={800} fontSize={15}>Dr. {doc.firstName} {doc.lastName}</Typography>
                <Chip icon={sc.icon} label={doc.verificationStatus?.toUpperCase()}
                  size="small" sx={{ bgcolor:sc.bg, color:sc.color, fontWeight:700, fontSize:"0.68rem",
                    "& .MuiChip-icon":{ color:sc.color } }} />
              </Box>
            </Stack>

            <Divider />

            {/* Info rows */}
            {[
              { icon:<EmailIcon fontSize="small" />,          text:doc.email },
              { icon:<BadgeIcon fontSize="small" />,          text:doc.licenseNumber },
              { icon:<LocalHospitalIcon fontSize="small" />,  text:doc.hospital },
              { icon:<WorkIcon fontSize="small" />,           text:`${doc.experience || "?"} years exp.` },
            ].map(({ icon, text }, i) => text && (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Box sx={{ color:"#94a3b8" }}>{icon}</Box>
                <Typography variant="body2" color="text.secondary">{text}</Typography>
              </Stack>
            ))}

            <Chip icon={<MedicalServicesIcon />} label={doc.specialty||"—"} size="small" variant="outlined"
              sx={{ width:"fit-content", borderColor:alpha(theme.palette.primary.main, 0.4),
                color:theme.palette.primary.main, fontWeight:600 }} />

            {doc.licenseDocument && (
              <Button size="small" variant="outlined" component="a"
                href={`${API}/uploads/${doc.licenseDocument}`}
                target="_blank" rel="noopener noreferrer"
                sx={{ borderRadius:"10px", textTransform:"none", fontWeight:600 }}>
                View License Document
              </Button>
            )}

            {showActions && doc.verificationStatus === "pending" && (
              <>
                <Divider />
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" onClick={() => handleVerify(doc._id)}
                    sx={{ borderRadius:"12px", textTransform:"none", fontWeight:700,
                      background:"linear-gradient(135deg,#43e97b,#38f9d7)", boxShadow:"none",
                      "&:hover":{ opacity:0.9 } }}>
                    ✓ Verify
                  </Button>
                  <Button fullWidth variant="outlined" color="error" onClick={() => setRejectDialog(doc._id)}
                    sx={{ borderRadius:"12px", textTransform:"none", fontWeight:700 }}>
                    ✗ Reject
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Paper>
      </Grid>
    );
  };

  const tabDocs = [filtered("pending"), filtered("verified"), filtered("rejected")];
  const tabConfigs = [
    { label:"Pending",  showActions:true  },
    { label:"Verified", showActions:false },
    { label:"Rejected", showActions:false },
  ];

  return (
    <Box sx={{ bgcolor:"#f0f4f8", minHeight:"100vh", p:3 }}>
      {/* Header Banner */}
      <Box sx={{
        mb:3, p:3, borderRadius:"20px",
        background:"linear-gradient(135deg,#667eea,#764ba2)",
        color:"#fff", boxShadow:"0 8px 32px rgba(102,126,234,0.3)"
      }}>
        <Typography variant="h4" fontWeight={900}>Doctor Verification Panel</Typography>
        <Typography variant="body2" sx={{ opacity:0.85, mt:0.5 }}>
          Review credentials, verify licenses, and manage doctor approvals
        </Typography>
        <Stack direction="row" spacing={2} mt={2}>
          {["pending","verified","rejected"].map(s => (
            <Chip key={s}
              label={`${s.charAt(0).toUpperCase()+s.slice(1)}: ${filtered(s).length}`}
              sx={{ bgcolor:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:700 }}
            />
          ))}
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius:"16px", mb:3, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": { textTransform:"none", fontWeight:600, fontSize:15 },
            "& .Mui-selected": { color:"#667eea" },
            "& .MuiTabs-indicator": { background:"linear-gradient(135deg,#667eea,#764ba2)", height:3, borderRadius:2 }
          }}>
          {tabConfigs.map((t,i) => (
            <Tab key={i} label={`${t.label} (${tabDocs[i].length})`} />
          ))}
        </Tabs>
      </Paper>

      {/* Cards */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12} sx={{ display:"flex", justifyContent:"center", py:6 }}>
            <CircularProgress />
          </Grid>
        ) : tabDocs[tab].length === 0
          ? renderEmpty(["pending","verified","rejected"][tab])
          : tabDocs[tab].map(doc => renderCard(doc, tabConfigs[tab].showActions))
        }
      </Grid>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectDialog} onClose={() => { setRejectDialog(null); setRejectReason(""); }}
        maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:"20px" } }}>
        <DialogTitle sx={{ fontWeight:700 }}>Reject Doctor</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2}>
            Please provide a reason for rejection (optional but recommended):
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="e.g. License document unclear, specialty mismatch…"
            value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root":{ borderRadius:"12px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => { setRejectDialog(null); setRejectReason(""); }}
            sx={{ textTransform:"none", fontWeight:600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}
            sx={{ textTransform:"none", fontWeight:700, borderRadius:"10px" }}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDoctorVerification;