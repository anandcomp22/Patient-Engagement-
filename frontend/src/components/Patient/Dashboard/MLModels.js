import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const MLModels = () => {
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
    setResult(null);
    setError('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select a valid image file (JPEG, PNG, etc).');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedModel || !selectedFile) {
      setError('Please select a model and upload an image.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('model', selectedModel);

    try {
      const response = await fetch('http://localhost:8000/api/ml/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image. Please try again later.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during prediction.');
    } finally {
      setLoading(false);
    }
  };

  const isDiseaseDetected = result && (result.prediction.toLowerCase().includes('detected') && !result.prediction.toLowerCase().includes('no '));

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScienceIcon fontSize="large" /> ML Disease Detection
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your medical reports or scans and select a targeted AI model to receive a preliminary health assessment.
      </Typography>

      <Card elevation={4} sx={{ borderRadius: 3, mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Left Column: Form */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="model-select-label">Select Disease Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  value={selectedModel}
                  label="Select Disease Model"
                  onChange={handleModelChange}
                >
                  <MenuItem value="cataract">Cataract Detection</MenuItem>
                  <MenuItem value="pneumonia">Pneumonia Detection</MenuItem>
                </Select>
              </FormControl>

              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fbfc', borderRadius: 2, border: '1px solid #e0e0e0', mb: 3 }}>
                <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                  Instructions for Upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  1. Choose the relevant model from the dropdown. <br />
                  2. Upload a clear, well-lit image of the scan (e.g., Eye image for Cataract, Chest X-ray for Pneumonia). <br />
                  3. Accepted formats: JPG, PNG. Max size: 5MB.
                </Typography>
              </Paper>

              <Box sx={{ mb: 3 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ py: 1.5, borderRadius: 2, borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    Select Image
                  </Button>
                </label>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!selectedModel || !selectedFile || loading}
                sx={{ py: 1.5, borderRadius: 2, fontSize: '1.05rem', fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Prediction'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
            </Grid>

            {/* Right Column: Preview & Results */}
            <Grid item xs={12} md={6}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Image Preview */}
                <Paper
                  elevation={0}
                  sx={{
                    flexGrow: previewUrl ? 0 : 1,
                    minHeight: 200,
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    mb: result ? 3 : 0
                  }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 'auto', maxHeight: 250, objectFit: 'contain' }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HealthAndSafetyIcon /> Image preview will appear here
                    </Typography>
                  )}
                </Paper>

                {/* Inference Result */}
                {result && (
                  <Card elevation={2} sx={{ mt: 'auto', borderRadius: 2, bgcolor: isDiseaseDetected ? '#fff4e5' : '#e8f5e9' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {isDiseaseDetected ? <WarningAmberIcon color="warning" /> : <CheckCircleIcon color="success" />}
                        <Typography variant="h6" color={isDiseaseDetected ? 'warning.dark' : 'success.main'} fontWeight="bold">
                          {result.prediction}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      
                      {result.confidence && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
                        </Typography>
                      )}
                      
                      <Typography variant="body2" sx={{ mt: 1, color: '#333' }}>
                        {result.message}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MLModels;
