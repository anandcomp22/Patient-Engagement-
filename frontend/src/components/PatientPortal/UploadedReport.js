import React, { useState } from "react";
import { Box, Typography, Button, TextField, Paper } from "@mui/material"
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import dayjs from "dayjs";
import axios from "axios";

export default function UploadReport() {
  const [uploadDate, setUploadDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [generationPlace, setGenerationPlace] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file || !generationPlace) {
      alert("Please fill all fields and select a file");
      return;
    }
    const formData = new FormData();
    formData.append("uploadDate", uploadDate);
    formData.append("generationPlace", generationPlace);
    formData.append("report", file);

    try {
      await axios.post("http://localhost:8000/patient/upload-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Report uploaded successfully");
      setGenerationPlace("");
      setFile(null);
    } catch (error) {
      console.error(error);
      alert("Failed to upload report");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, color: "#008cffff" }}>
        Upload Medical Report
      </Typography>

      <TextField
        label="Upload Date"
        type="date"
        value={uploadDate}
        onChange={(e) => setUploadDate(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        label="Report Generation Place"
        value={generationPlace}
        onChange={(e) => setGenerationPlace(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Button
        variant="outlined"
        component="label"
        sx={{ mb: 2 }}
        startIcon={<CloudUploadIcon />}
      >
        Select Report
        <input type="file" hidden onChange={handleFileChange} />
      </Button>
      {file && <Typography variant="body2">{file.name}</Typography>}

      <Button
        variant="contained"
        sx={{ bgcolor: "#008cffff" }}
        onClick={handleUpload}
      >
        Upload
      </Button>
    </Paper>
  );
}
