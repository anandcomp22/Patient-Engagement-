import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Fade,
  IconButton
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Coronavirus as CovidIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// Modern styled card using framer-motion
const MotionCard = motion(Card);

const DiseaseDetection = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    resetState();
  };

  const resetState = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    const endpoint =
      tabIndex === 0
        ? "http://localhost:5050/predict/cataract"
        : "http://localhost:5050/predict/pneumonia";

    try {
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        "Failed to connect to the AI analysis server. Make sure the ML service is running on port 5050."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const renderSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return <WarningIcon sx={{ color: "#ef4444", fontSize: 40 }} />;
      case "medium":
        return <InfoIcon sx={{ color: "#f59e0b", fontSize: 40 }} />;
      case "low":
        return <CheckCircleIcon sx={{ color: "#10b981", fontSize: 40 }} />;
      default:
        return <InfoIcon sx={{ color: "#3b82f6", fontSize: 40 }} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
      case "medium": return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" };
      case "low": return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
      default: return { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" };
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Box 
          sx={{ 
            p: 1.5, 
            borderRadius: "12px", 
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            boxShadow: "0 4px 10px rgba(59, 130, 246, 0.3)"
          }}
        >
          <VisibilityIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}>
            AI Disease Detection
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            Powered by Advanced YOLOv8 Deep Learning Models
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Upload & Controls */}
        <Grid item xs={12} lg={5}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              borderRadius: "24px",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              overflow: "hidden"
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}>
              <Tabs 
                value={tabIndex} 
                onChange={handleTabChange} 
                centered
                sx={{
                  "& .MuiTab-root": { py: 2.5, fontWeight: "bold", fontSize: "1rem" },
                  "& .Mui-selected": { color: "#2563eb" },
                  "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: "#2563eb" }
                }}
              >
                <Tab icon={<VisibilityIcon sx={{ mb: 0.5 }} />} label="Cataract" />
                <Tab icon={<CovidIcon sx={{ mb: 0.5 }} />} label="Pneumonia" />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Typography variant="h6" sx={{ color: "#334155", fontWeight: 600, mb: 1 }}>
                  {tabIndex === 0 ? "Upload Eye Image" : "Upload Chest X-Ray"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Upload a clear image for accurate AI analysis
                </Typography>
              </Box>

              <Box
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("ai-file-upload").click()}
                sx={{
                  border: "2px dashed",
                  borderColor: isDragging ? "#3b82f6" : (previewUrl ? "#10b981" : "#cbd5e1"),
                  borderRadius: "20px",
                  p: 4,
                  textAlign: "center",
                  bgcolor: isDragging ? "#eff6ff" : (previewUrl ? "#f0fdf4" : "#f8fafc"),
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  position: "relative",
                  "&:hover": {
                    borderColor: previewUrl ? "#10b981" : "#3b82f6",
                    bgcolor: previewUrl ? "#ecfdf5" : "#eff6ff",
                    transform: "translateY(-2px)"
                  }
                }}
              >
                <input id="ai-file-upload" type="file" accept="image/*" hidden onChange={onFileChange} />
                
                <AnimatePresence mode="wait">
                  {previewUrl ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Box sx={{ position: "relative", display: "inline-block" }}>
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          style={{ 
                            maxHeight: "200px", 
                            maxWidth: "100%", 
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                          }} 
                        />
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            resetState();
                          }}
                          sx={{
                            position: "absolute",
                            top: -12,
                            right: -12,
                            bgcolor: "white",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            "&:hover": { bgcolor: "#fee2e2", color: "#ef4444" }
                          }}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <CloudUploadIcon sx={{ fontSize: 64, color: isDragging ? "#3b82f6" : "#94a3b8", mb: 2 }} />
                      <Typography variant="h6" sx={{ color: "#334155", mb: 1 }}>
                        Drag & Drop image here
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                        or click to browse from your computer
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={!file || analyzing}
                onClick={handleAnalyze}
                sx={{
                  mt: 4,
                  py: 1.8,
                  borderRadius: "16px",
                  fontSize: "1.05rem",
                  fontWeight: "bold",
                  textTransform: "none",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 25px rgba(37, 99, 235, 0.35)",
                  },
                  "&:disabled": {
                    background: "#e2e8f0",
                    color: "#94a3b8"
                  }
                }}
              >
                {analyzing ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={24} color="inherit" />
                    Analyzing Image...
                  </Box>
                ) : (
                  "Run AI Analysis"
                )}
              </Button>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Right Column: Results Area */}
        <Grid item xs={12} lg={7}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            sx={{
              borderRadius: "24px",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <Box sx={{ p: 4, borderBottom: "1px solid #f1f5f9" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b" }}>
                Analysis Results
              </Typography>
            </Box>

            <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
              {error && (
                <Fade in={true}>
                  <Paper sx={{ p: 3, bgcolor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "16px" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <WarningIcon />
                      <Typography sx={{ fontWeight: 500 }}>{error}</Typography>
                    </Box>
                  </Paper>
                </Fade>
              )}

              {!analyzing && !result && !error && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, opacity: 0.6, py: 8 }}>
                  <img src="https://cdn-icons-png.flaticon.com/512/2040/2040504.png" alt="Upload" style={{ width: 120, filter: "grayscale(1) opacity(0.3)", marginBottom: 24 }} />
                  <Typography variant="h6" sx={{ color: "#64748b" }}>Awaiting Image Input</Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
                    Upload an image and click analyze to see AI insights here.
                  </Typography>
                </Box>
              )}

              {analyzing && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, py: 8 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Box sx={{ position: "relative", width: 80, height: 80 }}>
                      <CircularProgress size={80} thickness={2} sx={{ color: "#3b82f6" }} />
                      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                        <VisibilityIcon sx={{ color: "#3b82f6", opacity: 0.5 }} />
                      </Box>
                    </Box>
                  </motion.div>
                  <Typography variant="h6" sx={{ mt: 4, color: "#3b82f6", fontWeight: "bold" }}>Processing with YOLOv8...</Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "#64748b" }}>Extracting features and classifying anomalies</Typography>
                </Box>
              )}

              {result && result.summary && (
                <Fade in={true}>
                  <Box>
                    {/* Summary Alert Box */}
                    <Paper 
                      sx={{ 
                        p: 3, 
                        mb: 4,
                        borderRadius: "20px", 
                        bgcolor: getSeverityColor(result.summary.severity).bg,
                        border: "1px solid",
                        borderColor: getSeverityColor(result.summary.severity).border,
                      }}
                    >
                      <Grid container spacing={3} alignItems="center">
                        <Grid item>
                          {renderSeverityIcon(result.summary.severity)}
                        </Grid>
                        <Grid item xs>
                          <Typography variant="h6" sx={{ color: getSeverityColor(result.summary.severity).text, fontWeight: "bold", mb: 0.5 }}>
                            {result.summary.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: getSeverityColor(result.summary.severity).text, opacity: 0.9, lineHeight: 1.6 }}>
                            {result.summary.message}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Image Result (For Object Detection) */}
                    {result.annotated_image && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#64748b", mb: 1, textTransform: "uppercase", letterSpacing: "1px" }}>
                          AI Visual Detection
                        </Typography>
                        <Box sx={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", bgcolor: "#f8fafc", p: 1 }}>
                          <img 
                            src={`data:image/jpeg;base64,${result.annotated_image}`} 
                            alt="Annotated Result" 
                            style={{ width: "100%", borderRadius: "12px", display: "block" }} 
                          />
                        </Box>
                      </Box>
                    )}

                    {/* Predictions List */}
                    {((result.detections && result.detections.length > 0) || (result.all_predictions && result.all_predictions.length > 0)) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#64748b", mb: 2, textTransform: "uppercase", letterSpacing: "1px" }}>
                          Confidence Metrics
                        </Typography>
                        <Grid container spacing={2}>
                          {(result.all_predictions || result.detections).map((item, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                              <Paper sx={{ p: 2, borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography sx={{ fontWeight: 600, color: "#334155", textTransform: "capitalize" }}>
                                  {item.label}
                                </Typography>
                                <Chip 
                                  label={`${item.confidence}%`} 
                                  size="small" 
                                  sx={{ 
                                    fontWeight: "bold", 
                                    bgcolor: item.confidence > 75 ? "#fee2e2" : (item.confidence > 40 ? "#fef3c7" : "#f1f5f9"),
                                    color: item.confidence > 75 ? "#991b1b" : (item.confidence > 40 ? "#92400e" : "#475569")
                                  }} 
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DiseaseDetection;
