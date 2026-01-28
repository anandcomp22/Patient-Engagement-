import React from "react";
import { Box, Typography, Button, Card, List, ListItem, ListItemText } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";

const prescriptions = [
  { id: 1, patient: "Shreyas Sadavarte", date: "2025-03-15", email: "shreyas.sadavarte_comp22@pccoer.in" },
  { id: 2, patient: "Prathmesh Vharkal", date: "2025-03-17", email: "prathmesh.vharkal_comp22@pccoer.in" },
  { id: 3, patient: "Sayyoni More", date: "2025-03-20", email: "sayyoni.more_comp22@pccoer.in" },
];

const handleGenerate = (patient, email) => {
  const prescriptionData = {
    patient,
    date: new Date().toISOString().split("T")[0], 
    email,
    medicines: [
      { name: "Paracetamol", dosage: "500mg" },
      { name: "Amoxicillin", dosage: "250mg" }
    ]
  };

  fetch("http://localhost:8000/prescriptions/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prescriptionData),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.file) {
        alert(`Prescription for ${patient} generated successfully!`);
      } else {
        alert("Error generating prescription.");
      }
    })
    .catch(() => alert("Error generating prescription."));
};

const handleDownload = (patient) => {
  const filename = `prescription_${patient.replace(/\s+/g, "_")}.pdf`;
  fetch(`http://localhost:8000/prescriptions/download/${filename}`)
    .then((res) => res.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(() => alert("Error downloading file!"));
};

const handleSendEmail = (email, patient) => {
  const filename = `prescription_${patient.replace(/\s+/g, "_")}.pdf`;
  fetch("http://localhost:8000/prescriptions/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, file: filename }),
  })
    .then((res) => res.json())
    .then(() => alert(`Email sent to ${email}!`))
    .catch(() => alert("Error sending email!"));
};

const Prescriptions = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, mt: 6 }}>
        Prescription List
      </Typography>

      {prescriptions.map(({ id, patient, date, email }) => (
        <Card key={id} sx={{ padding: 2, boxShadow: 3, borderRadius: 2, mb: 3 }}>
          <List>
            <ListItem sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <ListItemText primary={patient} secondary={`Date: ${date}`} />
              <Button variant="contained" color="primary" onClick={() => handleGenerate(patient, email)} startIcon={<SaveIcon />}>
                Generate & Save
              </Button>
              <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={() => handleDownload(patient)}>
                Download
              </Button>
              <Button variant="contained" color="primary" startIcon={<SendIcon />} onClick={() => handleSendEmail(email, patient)}>
                Send
              </Button>
            </ListItem>
          </List>
        </Card>
      ))}
    </Box>
  );
};

export default Prescriptions;


