import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Chip, Divider } from '@mui/material';
import { Add, VideoCall, CheckCircle, ErrorOutline, Schedule } from '@mui/icons-material';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const [timePart, modifier] = timeStr.trim().split(" ");
    let [hours, minutes] = timePart.split(":");
    if (hours === '12' && modifier === 'AM') hours = '00';
    else if (modifier === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const getFullDateTime = (date, time) => {
    const dateOnly = new Date(date).toISOString().split('T')[0];
    return new Date(`${dateOnly}T${convertTo24Hour(time)}`);
  };

  const categorizeAppointments = () => {
    const now = new Date();
    const categories = { upcoming: [], completed: [], missed: [] };

    appointments.forEach(appt => {
      const apptDate = getFullDateTime(appt.appointmentDate || appt.date, appt.startTime || appt.time);
      const isDone = (appt.appstatus || appt.status || "").toLowerCase().includes("done") || 
                     (appt.appstatus || appt.status || "").toLowerCase() === "completed";

      if (isDone) {
        categories.completed.push(appt);
      } else if (apptDate < now) {
        categories.missed.push(appt);
      } else {
        categories.upcoming.push(appt);
      }
    });

    // Sort: Upcoming (closest first), Others (recent first)
    categories.upcoming.sort((a,b) => getFullDateTime(a.appointmentDate, a.startTime) - getFullDateTime(b.appointmentDate, b.startTime));
    categories.completed.sort((a,b) => getFullDateTime(b.appointmentDate, b.startTime) - getFullDateTime(a.appointmentDate, a.startTime));
    categories.missed.sort((a,b) => getFullDateTime(b.appointmentDate, b.startTime) - getFullDateTime(a.appointmentDate, a.startTime));

    return categories;
  };

  const AppointmentTable = ({ data, type }) => {
    if (data.length === 0) return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', mb: 4, borderRadius: 3 }}>
        <Typography variant="body2" color="text.secondary">No {type} appointments found.</Typography>
      </Paper>
    );

    return (
      <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>DATE & TIME</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>DOCTOR</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#475569' }}>ACTION</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((appt) => {
              const apptDate = getFullDateTime(appt.appointmentDate || appt.date, appt.startTime || appt.time);
              const now = new Date();
              const isJoinable = type === 'upcoming' && Math.abs(now - apptDate) / (1000 * 60) <= 30;

              return (
                <TableRow key={appt._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700">
                      {new Date(appt.appointmentDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{appt.startTime}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{appt.doctorName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        label={type === 'missed' ? 'Missed' : (type === 'upcoming' ? (appt.appstatus === 'pending' ? 'Pending' : 'Confirmed') : 'Completed')}
                        size="small"
                        icon={type === 'upcoming' ? <Schedule /> : (type === 'completed' ? <CheckCircle /> : <ErrorOutline />)}
                        sx={{ 
                          fontWeight: 800, fontSize: '0.7rem',
                          bgcolor: type === 'upcoming' ? (appt.appstatus === 'pending' ? '#fef3c7' : '#dbeafe') : (type === 'completed' ? '#dcfce7' : '#fee2e2'),
                          color: type === 'upcoming' ? (appt.appstatus === 'pending' ? '#92400e' : '#1e40af') : (type === 'completed' ? '#166534' : '#991b1b')
                        }}
                      />
                      <Chip 
                        label={appt.paymentstatus === 'paid' ? 'Paid' : 'Unpaid'}
                        size="small"
                        sx={{ 
                          fontWeight: 800, fontSize: '0.6rem', height: 18,
                          bgcolor: appt.paymentstatus === 'paid' ? '#dcfce7' : '#fee2e2',
                          color: appt.paymentstatus === 'paid' ? '#166534' : '#991b1b'
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isJoinable && (
                        <Button
                          variant="contained" size="small" startIcon={<VideoCall />}
                          href={`/patient/video-call?roomId=${appt.roomId}`}
                          sx={{ bgcolor: '#1E5DA9', borderRadius: 2 }}
                        >
                          Join Call
                        </Button>
                      )}
                      <Button variant="outlined" size="small" sx={{ borderRadius: 2, color: '#1E5DA9', borderColor: '#1E5DA9' }}>
                        Details
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const categories = categorizeAppointments();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#1E5DA9', fontWeight: 900 }}>My Appointments</Typography>
          <Typography variant="body2" color="text.secondary">Manage your consultation schedule and history</Typography>
        </Box>
        <Button 
          variant="contained" startIcon={<Add />} href="/patient/book"
          sx={{ bgcolor: '#1E5DA9', borderRadius: 3, px: 3, height: '45px', fontWeight: 800 }}
        >
          Book Appointment
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress color="primary" /></Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ color: '#2563eb' }} /> Upcoming Consultations
          </Typography>
          <AppointmentTable data={categories.upcoming} type="upcoming" />

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: '#16a34a' }} /> Completed
          </Typography>
          <AppointmentTable data={categories.completed} type="completed" />

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutline sx={{ color: '#dc2626' }} /> Missed / Expired
          </Typography>
          <AppointmentTable data={categories.missed} type="missed" />
        </>
      )}
    </Box>
  );
}