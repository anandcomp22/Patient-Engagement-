import React from "react";
import { TextField, Button, Box } from "@mui/material";

const AvailabilitySettings = () => (
  <Box>
    <h3>Set Availability</h3>
    <TextField fullWidth label="Available Days" margin="normal" />
    <TextField fullWidth label="Time Slots" margin="normal" />
    <Button variant="contained" color="primary">Save</Button>
  </Box>
);

export default AvailabilitySettings;