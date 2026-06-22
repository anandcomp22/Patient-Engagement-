import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Card,
  Avatar,
  Divider,
} from "@mui/material";
import {
  ExpandMore,
  HelpOutline,
  Mail,
  Phone,
  Chat,
  VideoCall,
  Lock,
  Payment,
  Description,
  CalendarMonth,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "../../Doctor/Dashboard/HelpSupport.css";

const faqs = [
  {
    category: "Appointments & Booking",
    icon: <CalendarMonth />,
    questions: [
      { q: "How do I book a new consultation?", a: "Go to the 'Book Appointment' tab in your sidebar. Choose your preferred doctor, select an available date and time slot, and confirm your booking." },
      { q: "Can I cancel or reschedule my appointment?", a: "Yes, you can manage your appointments from the 'Appointments' tab. Please note that cancellations should be made at least 4 hours before the scheduled time for a full refund." }
    ]
  },
  {
    category: "Medical Records & Reports",
    icon: <Description />,
    questions: [
      { q: "How do I upload my previous medical reports?", a: "Go to the 'Upload Report' section. You can drag and drop your PDF or image files (up to 10MB) and tag them with a report type (e.g., Blood Test, X-Ray) for your doctor to review." },
      { q: "Are my medical records private?", a: "Absolutely. Your reports are encrypted and only accessible by you and the doctor you have an appointment with. Even our administrators cannot view your personal medical data." }
    ]
  },
  {
    category: "Video Consultations",
    icon: <VideoCall />,
    questions: [
      { q: "My microphone or camera isn't working.", a: "Ensure you have granted camera and microphone permissions to your browser. You can test your devices in the 'Video Call Room' before your session starts. If issues persist, try refreshing the page or using a different browser (Chrome/Edge recommended)." },
      { q: "How do I join the call?", a: "A 'Join' button will appear on your dashboard 5 minutes before your appointment. You can also join via the 'Video Call Room' using your Room ID." }
    ]
  },
  {
    category: "Payments",
    icon: <Payment />,
    questions: [
      { q: "What payment methods are accepted?", a: "We currently accept all major credit/debit cards via Stripe and also support PayPal for international consultations." },
      { q: "I was charged but my appointment isn't confirmed.", a: "Don't worry. Sometimes there's a slight delay in payment verification. If your appointment doesn't show as 'Confirmed' within 10 minutes, please contact our support team with your transaction ID." }
    ]
  }
];

const PatientHelpSupport = () => {
  const [search, setSearch] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(search.toLowerCase()) ||
      q.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 5000);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1200px", mx: "auto" }}>
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h3" fontWeight="800" sx={{ color: "#1E5DA9", mb: 2 }}>
            Patient Support Center
          </Typography>
          <Typography variant="h6" sx={{ color: "#777", mb: 4 }}>
            How can we help you with your healthcare journey today?
          </Typography>

          <TextField
            fullWidth
            placeholder="Search for help (e.g. 'how to upload', 'payment')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              maxWidth: "600px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "50px",
                backgroundColor: "#fff",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
              }
            }}
          />
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* FAQ Section */}
        <Grid item xs={12} md={7}>
          <Typography variant="h5" fontWeight="700" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
            <HelpOutline sx={{ color: "#1E5DA9" }} /> Frequently Asked Questions
          </Typography>

          {filteredFaqs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4 }}>
              <Typography color="textSecondary">No results found for "{search}"</Typography>
            </Paper>
          ) : (
            filteredFaqs.map((cat, idx) => (
              <Box key={idx} sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2, color: "#555", display: "flex", alignItems: "center", gap: 1 }}>
                  {cat.icon} {cat.category}
                </Typography>
                {cat.questions.map((q, qIdx) => (
                  <Accordion key={qIdx} sx={{
                    mb: 1,
                    borderRadius: "12px !important",
                    "&:before": { display: "none" },
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    border: "1px solid #eee"
                  }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography fontWeight="600">{q.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ color: "#666", lineHeight: 1.6 }}>{q.a}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ))
          )}
        </Grid>

        {/* Contact Support Section */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: "sticky", top: 100 }}>
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: "0 10px 30px rgba(30,93,169,0.1)", border: "1px solid rgba(30,93,169,0.1)" }}>
              <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>Help Request</Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="What's the issue?" multiline rows={2} variant="outlined" required size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Describe in detail..." multiline rows={3} variant="outlined" required />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={emailSent}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background: emailSent ? "#4CAF50" : "linear-gradient(135deg, #62b8ffff, #1E5DA9)",
                        fontWeight: 700,
                        textTransform: "none"
                      }}
                    >
                      {emailSent ? "Support Request Sent!" : "Submit Request"}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#E3F2FD", color: "#1E5DA9" }}><Mail /></Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Email Us</Typography>
                    <Typography variant="body2" fontWeight="700">patients@aidme.healthcare</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#E8F5E9", color: "#4CAF50" }}><Phone /></Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Call Helpline</Typography>
                    <Typography variant="body2" fontWeight="700">1800-AIDME-PATIENT</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientHelpSupport;
