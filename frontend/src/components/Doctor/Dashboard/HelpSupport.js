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
  IconButton,
  Divider,
  Card,
  Avatar,
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
  PersonalVideo,
  Description,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import "./HelpSupport.css";

const faqs = [
  {
    category: "General",
    icon: <HelpOutline />,
    questions: [
      { q: "How do I join a video consultation?", a: "To join a call, go to your dashboard and click the 'Join' button next to the upcoming appointment. You can also access it from the 'Video Calls' tab in the sidebar." },
      { q: "Can I use AidME on my mobile device?", a: "Yes! AidME is fully responsive. You can log in via your mobile browser and access all features including video calls and prescriptions." }
    ]
  },
  {
    category: "Prescriptions",
    icon: <Description />,
    questions: [
      { q: "How do patients receive their prescriptions?", a: "Once you save and send a prescription, the patient receives an email with a secure PDF attachment. They can also view and download it directly from their 'My Prescriptions' portal." },
      { q: "Can I edit a prescription after sending it?", a: "For medical integrity, prescriptions cannot be edited once sent. However, you can issue a revised prescription if necessary." }
    ]
  },
  {
    category: "Security & Privacy",
    icon: <Lock />,
    questions: [
      { q: "Is my data secure on AidME?", a: "We use enterprise-grade SSL encryption for all data transfers. Video calls are peer-to-peer and encrypted, ensuring complete privacy during consultations." },
      { q: "Who can see my patient medical records?", a: "Only the assigned doctor and the patient themselves can access their medical documents. Admin staff can only see appointment logs but not medical details." }
    ]
  },
  {
    category: "Billing & Payments",
    icon: <Payment />,
    questions: [
      { q: "How does the payment settlement work?", a: "Payments made by patients via Stripe/PayPal are held securely and settled to your linked bank account every Friday, after a nominal platform fee deduction." }
    ]
  }
];

const HelpSupport = () => {
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
            Help & Support Center
          </Typography>
          <Typography variant="h6" sx={{ color: "#777", mb: 4 }}>
            Everything you need to know about the AidME platform
          </Typography>

          <TextField
            fullWidth
            placeholder="Search for help (e.g. 'video call', 'billing')..."
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
              <Typography variant="h5" fontWeight="700" sx={{ mb: 3 }}>Contact Support</Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Subject" multiline rows={2} variant="outlined" required size="small" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Message" multiline rows={3} variant="outlined" required />
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
                      {emailSent ? "Message Sent!" : "Send Message"}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#E3F2FD", color: "#1E5DA9" }}><Mail /></Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Email Support</Typography>
                    <Typography variant="body2" fontWeight="700">support@aidme.healthcare</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#E8F5E9", color: "#4CAF50" }}><Phone /></Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Call Support</Typography>
                    <Typography variant="body2" fontWeight="700">+91 1800-AID-ME-NOW</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#FFF3E0", color: "#FF9800" }}><Chat /></Avatar>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Live Chat</Typography>
                    <Typography variant="body2" fontWeight="700">Available 24/7 in-app</Typography>
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

export default HelpSupport;
