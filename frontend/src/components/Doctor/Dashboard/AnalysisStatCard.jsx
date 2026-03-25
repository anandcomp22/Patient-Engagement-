import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";


const AnalysisStatCard = ({
  title,
  value,
  icon,
  gradient = "linear-gradient(135deg, #2563eb, #3b82f6)",
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
  <Grid item xs={12} sm={6} md={3}>
    <SummaryCard
      title="Total Patients"
      value="33"
      icon={<PeopleIcon />}
    />
  </Grid>

  <Grid item xs={12} sm={6} md={3}>
    <SummaryCard
      title="Total Appointments"
      value="39"
      icon={<EventNoteIcon />}
    />
  </Grid>

  <Grid item xs={12} sm={6} md={3}>
    <SummaryCard
      title="Avg Time (min)"
      value="30"
      icon={<AccessTimeIcon />}
    />
  </Grid>

  <Grid item xs={12} sm={6} md={3}>
    <SummaryCard
      title="Total Income"
      value="₹1550"
      icon={<CurrencyRupeeIcon />}
    />
  </Grid>
</Grid>

  );
};

const SummaryCard = ({ title, value, icon }) => (
  <Card
    elevation={0}
    sx={{
      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
      color: "#fff",
      borderRadius: "14px",
      boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "10px",
            p: 1.2,
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);


export default AnalysisStatCard;
