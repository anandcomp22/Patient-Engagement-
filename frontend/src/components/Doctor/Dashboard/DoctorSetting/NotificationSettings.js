import React from "react";
import { FormControlLabel, Switch, Box } from "@mui/material";

const NotificationSettings = () => (
  <Box>
    <h3>Notification Preferences</h3>
    <FormControlLabel control={<Switch />} label="Email Notifications" />
    <FormControlLabel control={<Switch />} label="SMS Notifications" />
  </Box>
);

export default NotificationSettings;
