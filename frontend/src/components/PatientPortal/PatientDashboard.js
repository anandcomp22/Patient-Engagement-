import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Button } from '@mui/material';
import { CalendarToday, MedicalServices, VideoCall } from '@mui/icons-material';

export default function PatientDashboard() {
  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Typography variant="h4" sx={{ color: '#1E5DA9', mb: 4 }}>
        Patient Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #1E5DA9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Upcoming Appointments</Typography>
              </Box>
              <Typography variant="body1">You have 2 upcoming appointments</Typography>
              <Button 
                variant="text" 
                sx={{ color: '#1E5DA9', mt: 2 }}
                href="/patient/appointments"
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #1E5DA9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MedicalServices sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Medical Records</Typography>
              </Box>
              <Typography variant="body1">Access your prescriptions and medical history</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #1E5DA9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VideoCall sx={{ color: '#1E5DA9', mr: 2 }} />
                <Typography variant="h6">Video Consultations</Typography>
              </Box>
              <Typography variant="body1">Start or join a video consultation</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}