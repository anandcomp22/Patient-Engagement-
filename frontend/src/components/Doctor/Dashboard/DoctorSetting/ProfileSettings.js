import React from "react";
import { TextField, Button, Box } from "@mui/material";

const ProfileSettings = () => (
  <Box>
    <h3>Update Profile</h3>
    <TextField fullWidth label="Name" margin="normal" />
    <TextField fullWidth label="Email" margin="normal" />
    <TextField fullWidth label="Phone" margin="normal" />
    <TextField fullWidth label="Specialty" margin="normal" />
    <Button variant="contained" color="primary">Save Changes</Button>
  </Box>
);

export default ProfileSettings;