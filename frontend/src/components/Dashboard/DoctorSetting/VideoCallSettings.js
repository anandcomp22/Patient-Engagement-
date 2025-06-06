import React from "react";
import { TextField, Button, Box } from "@mui/material";

const VideoCallSettings = () => (
  <Box>
    <h3>Video Call Settings</h3>
    <TextField fullWidth label="Preferred Platform (e.g. Zoom, Meet)" margin="normal" />
    <TextField fullWidth label="Meeting Link Template" margin="normal" />
    <Button variant="contained" color="primary">Save</Button>
  </Box>
);

export default VideoCallSettings;