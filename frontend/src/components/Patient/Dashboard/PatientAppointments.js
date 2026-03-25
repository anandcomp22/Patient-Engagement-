import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { Add, VideoCall, ArrowForwardIos } from '@mui/icons-material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use either the real logged in patient ID or fallback to the one dashboard uses
  const patientId = localStorage.getItem("patientId") || 123;

  useEffect(() => {
    axios
      .get(`${API}/patient/appointments/${patientId}`)
      .then((res) => {
        setAppointments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching appointments:", err);
        setLoading(false);
      });
  }, [patientId]);

  const isJoinAllowed = (apptDate, apptTime) => {
    if (!apptDate || !apptTime) return false;
    
    const now = new Date();
    // Parse the appointment dateTime
    const dateString = new Date(apptDate).toISOString().split('T')[0];
    const appointmentDateTime = new Date(`${dateString}T${convertTo24Hour(apptTime)}`);
    
    const diff = Math.abs(now - appointmentDateTime) / (1000 * 60);
    // Allow join within ±30 minutes for demo/flexibility
    return diff <= 30;
  };

  const convertTo24Hour = (timeStr) => {
    const [timePart, modifier] = timeStr.trim().split(" ");
    let [hours, minutes] = timePart.split(":");
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours}:${minutes}:00`;
  };

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#1E5DA9', fontWeight: 'bold' }}>
          Upcoming Appointments
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          sx={{ bgcolor: '#1E5DA9', '&:hover': { bgcolor: '#154281' }, borderRadius: '8px' }}
          href="/patient/book"
        >
          Book Appointment
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress size={40} sx={{ color: '#1E5DA9' }} />
        </Box>
      ) : appointments.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No upcoming appointments found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appt) => {
                const isReadyToJoin = isJoinAllowed(appt.appointmentDate, appt.startTime);
                return (
                  <TableRow key={appt._id || appt.id} hover>
                    <TableCell>{new Date(appt.appointmentDate || appt.date).toLocaleDateString()}</TableCell>
                    <TableCell>{appt.startTime || appt.time}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{appt.doctorName || appt.doctor}</TableCell>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '12px',
                          bgcolor: (appt.appstatus || appt.status) === 'confirmed' ? '#dcfce7' : '#fef3c7',
                          color: (appt.appstatus || appt.status) === 'confirmed' ? '#166534' : '#92400e',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {appt.appstatus || appt.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small"
                          sx={{ 
                            color: '#1E5DA9', 
                            borderColor: '#1E5DA9',
                            borderRadius: '6px',
                            '&:hover': { borderColor: '#154281', bgcolor: '#f0f9ff' }
                          }}
                        >
                          Details
                        </Button>
                        
                        {(appt.appstatus === 'confirmed' || appt.status === 'Confirmed') && appt.roomId && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<VideoCall />}
                            href={`/patient/video-call?roomId=${appt.roomId}`}
                            disabled={!isReadyToJoin}
                            title={!isReadyToJoin ? "Consultation link will be active at the scheduled time" : "Join Consultation"}
                            sx={{
                              bgcolor: isReadyToJoin ? '#2563eb' : '#cbd5e1',
                              color: 'white',
                              borderRadius: '6px',
                              boxShadow: 'none',
                              '&:hover': { 
                                bgcolor: isReadyToJoin ? '#1d4ed8' : '#cbd5e1',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            Join Call
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}