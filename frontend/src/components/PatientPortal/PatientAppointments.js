import React from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function PatientAppointments() {
  const appointments = [
    { id: 1, date: '2023-06-15', time: '10:00 AM', doctor: 'Dr. shreyas', status: 'Confirmed' },
    { id: 2, date: '2023-06-20', time: '02:30 PM', doctor: 'Dr. prathmesh', status: 'Pending' }
  ];

  return (
    <Box sx={{ p: 3, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#1E5DA9' }}>
          My Appointments
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          sx={{ bgcolor: '#1E5DA9', '&:hover': { bgcolor: '#154281' } }}
          href="/patient/book"
        >
          Book Appointment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appt) => (
              <TableRow key={appt.id}>
                <TableCell>{appt.date}</TableCell>
                <TableCell>{appt.time}</TableCell>
                <TableCell>{appt.doctor}</TableCell>
                <TableCell>
                  <Typography 
                    sx={{ 
                      color: appt.status === 'Confirmed' ? 'green' : 'orange',
                      fontWeight: 'bold'
                    }}
                  >
                    {appt.status}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ 
                      color: '#1E5DA9', 
                      borderColor: '#1E5DA9',
                      '&:hover': { borderColor: '#154281' }
                    }}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}