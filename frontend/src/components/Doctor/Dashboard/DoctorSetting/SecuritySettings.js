import React from "react";
import { TextField, Button, Box } from "@mui/material";

const SecuritySettings = () => (
  <Box>
    <h3>Change Password</h3>
    <TextField fullWidth type="password" label="Current Password" margin="normal" />
    <TextField fullWidth type="password" label="New Password" margin="normal" />
    <TextField fullWidth type="password" label="Confirm New Password" margin="normal" />
    <Button variant="contained" color="primary">Update Password</Button>
  </Box>
);

export default SecuritySettings;