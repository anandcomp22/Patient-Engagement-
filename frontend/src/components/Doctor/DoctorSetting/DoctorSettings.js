import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";

import ProfileSettings from "./ProfileSettings";
import AvailabilitySettings from "./AvailabilitySettings";
import SecuritySettings from "./SecuritySettings";
import NotificationSettings from "./NotificationSettings";
import VideoCallSettings from "./VideoCallSettings";
import PaymentSettings from "./PaymentSettings";
import DeleteAccount from "./DeleteAccount";

const DoctorSettings = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newIndex) => {
    setTabIndex(newIndex);
  };

  return (
    <Box sx={{ width: '100%', p: 10 }}>
      <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable">
        <Tab label="Profile" />
        <Tab label="Availability" />
        <Tab label="Security" />
        <Tab label="Notifications" />
        <Tab label="Video Call" />
        <Tab label="Payment" />
        <Tab label="Delete Account" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tabIndex === 0 && <ProfileSettings />}
        {tabIndex === 1 && <AvailabilitySettings />}
        {tabIndex === 2 && <SecuritySettings />}
        {tabIndex === 3 && <NotificationSettings />}
        {tabIndex === 4 && <VideoCallSettings />}
        {tabIndex === 5 && <PaymentSettings />}
        {tabIndex === 6 && <DeleteAccount />}
      </Box>
    </Box>
  );
};

export default DoctorSettings;
