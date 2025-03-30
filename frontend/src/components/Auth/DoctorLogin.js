import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const DoctorLogin = () => {
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1E5DA9' }}>
        Doctor Login
      </Typography>
      <TextField
        label="Email"
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
      />
      <Button 
        variant="contained"
        fullWidth
        sx={{ mt: 2, bgcolor: '#1E5DA9' }}
      >
        Login
      </Button>
    </Box>
  );
};

export default DoctorLogin;