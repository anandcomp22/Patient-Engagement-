import React from "react";
import { Box, Typography, Button, Card, List, ListItem, ListItemText } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

const prescriptions = [
  { id: 1, patient: "Shreyas Sadavarte", date: "2025-03-15", file: "prescription_Shreyas_Sadavarte.pdf" },
  { id: 2, patient: "Prathmesh Vharkal", date: "2025-03-17", file: "prescription_Prathmesh_vharkal.pdf" },
];

const Prescriptions = () => {
      const handleDownload = () => {
        fetch("http://localhost:3000/download-prescription")
          .then((res) => res.blob())
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Prescription.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          })
          .catch((err) => console.error("Download error:", err));
      };
      


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, mt :6 }}>
        Prescription List
      </Typography>
      <Card sx={{ padding: 2 }}>
        <List>
          {prescriptions.map((prescription) => (
            <ListItem key={prescription.id} sx={{ display: "flex", justifyContent: "space-between" }}>
              <ListItemText primary={prescription.patient} secondary={`Date: ${prescription.date}`} />
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(prescription.file)}>
                Download
              </Button>
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  );
};

export default Prescriptions;
