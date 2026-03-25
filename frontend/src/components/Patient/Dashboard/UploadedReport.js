import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  TextField,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  Fade,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LocalHospital as HospitalIcon,
  FilterList as FilterIcon,
  ErrorOutline as NoDataIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

const REPORT_TYPES = [
  "Blood Test",
  "X-Ray",
  "MRI Scan",
  "CT Scan",
  "Prescription",
  "Discharge Summary",
  "Lab Report",
  "Other",
];

const MotionCard = motion(Card);

export default function UploadReport() {
  const [uploadDate, setUploadDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [generationPlace, setGenerationPlace] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportName, setReportName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const patientId = localStorage.getItem("patientId") || 123;

  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/patient/reports/${patientId}`);
      setReports(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!reportName) setReportName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!reportName) setReportName(droppedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !generationPlace || !reportType || !reportName) {
      alert("Please fill all required fields and select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("patientId", patientId);
    formData.append("uploadDate", uploadDate);
    formData.append("generationPlace", generationPlace);
    formData.append("reportType", reportType);
    formData.append("reportName", reportName);
    formData.append("description", description);
    formData.append("report", file);

    try {
      await axios.post(`${API}/patient/upload-report`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Report uploaded successfully");
      // Reset form
      setFile(null);
      setGenerationPlace("");
      setReportType("");
      setReportName("");
      setDescription("");
      fetchReports();
    } catch (error) {
      console.error("Upload error details:", error);
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to upload report: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const getReportTypeColor = (type) => {
    switch (type) {
      case "Blood Test": return "#ef4444";
      case "X-Ray": return "#3b82f6";
      case "MRI Scan": return "#8b5cf6";
      case "Prescription": return "#10b981";
      default: return "#64748b";
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: 2 }}>
        <HospitalIcon sx={{ fontSize: 40, color: "#3b82f6" }} />
        Medical History & Reports
      </Typography>

      <Grid container spacing={4}>
        {/* Upload Section */}
        <Grid item xs={12} lg={5}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            sx={{ borderRadius: "24px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", overflow: "hidden" }}
          >
            <Box sx={{ p: 4, borderBottom: "1px solid #e2e8f0", bgcolor: "#fff" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#334155" }}>Upload New Report</Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>Add historical medical data to your profile</Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  border: "2px dashed",
                  borderColor: dragActive ? "#3b82f6" : "#cbd5e1",
                  borderRadius: "16px",
                  p: 4,
                  textAlign: "center",
                  bgcolor: dragActive ? "#eff6ff" : "#f8fafc",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  mb: 3,
                  position: "relative"
                }}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <input id="file-upload" type="file" hidden onChange={handleFileChange} />
                <CloudUploadIcon sx={{ fontSize: 48, color: dragActive ? "#3b82f6" : "#94a3b8", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#334155", mb: 1 }}>
                  {file ? file.name : "Drag and drop or click to upload"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  PDF, JPG, PNG up to 10MB
                </Typography>
                {file && (
                  <Chip 
                    label="File Selected" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 2 }}
                    onDelete={(e) => { e.stopPropagation(); setFile(null); }}
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Name"
                    placeholder="e.g. Annual Blood Checkup"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportType}
                      label="Report Type"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      {REPORT_TYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Upload Date"
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Generation Place"
                    placeholder="e.g. Apollo Hospital"
                    value={generationPlace}
                    onChange={(e) => setGenerationPlace(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    multiline
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                disabled={uploading || !file}
                sx={{
                  mt: 4,
                  py: 1.5,
                  borderRadius: "12px",
                  bgcolor: "#3b82f6",
                  fontWeight: "bold",
                  boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)",
                  "&:hover": { bgcolor: "#2563eb" }
                }}
                onClick={handleUpload}
              >
                {uploading ? "Uploading..." : "Save Report to History"}
              </Button>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* History Section */}
        <Grid item xs={12} lg={7}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            sx={{ borderRadius: "24px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", minHeight: "600px" }}
          >
            <Box sx={{ p: 4, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#334155" }}>Recent Reports</Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>Your medical journey at a glance</Typography>
              </Box>
              <IconButton sx={{ bgcolor: "#f1f5f9" }}><FilterIcon /></IconButton>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : reports.length === 0 ? (
                <Box sx={{ p: 10, textAlign: "center" }}>
                  <NoDataIcon sx={{ fontSize: 64, color: "#cbd5e1", mb: 2 }} />
                  <Typography variant="h6" sx={{ color: "#94a3b8" }}>No reports found yet</Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1" }}>Start by uploading your first medical report</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <AnimatePresence>
                    {reports.map((report, index) => (
                      <Grid item xs={12} key={report._id}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              border: "1px solid #f1f5f9",
                              bgcolor: "#fff",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#3b82f6",
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.05)",
                                transform: "translateY(-2px)"
                              }
                            }}
                          >
                            <Grid container alignItems="center" spacing={2}>
                              <Grid item>
                                <Box sx={{ 
                                  p: 1.5, 
                                  borderRadius: "12px", 
                                  bgcolor: `${getReportTypeColor(report.reportType)}15`,
                                  color: getReportTypeColor(report.reportType)
                                }}>
                                  <FileIcon />
                                </Box>
                              </Grid>
                              <Grid item xs>
                                <Typography sx={{ fontWeight: "bold", color: "#334155" }}>
                                  {report.reportName}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                                  <Chip 
                                    label={report.reportType} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: `${getReportTypeColor(report.reportType)}10`, 
                                      color: getReportTypeColor(report.reportType),
                                      fontWeight: "bold",
                                      height: "20px",
                                      fontSize: "0.7rem"
                                    }} 
                                  />
                                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                    {report.generationPlace} • {dayjs(report.uploadDate).format("MMM D, YYYY")}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Tooltip title="View Report">
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: "#3b82f6", bgcolor: "#eff6ff" }}
                                      onClick={() => window.open(`${API}/${report.filePath.replace(/\\/g, '/')}`, '_blank')}
                                    >
                                      <ViewIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download">
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: "#10b981", bgcolor: "#ecfdf5" }}
                                      onClick={() => window.open(`${API}/${report.filePath.replace(/\\/g, '/')}`, '_blank')}
                                    >
                                      <DownloadIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </AnimatePresence>
                </Grid>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
