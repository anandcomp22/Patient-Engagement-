import React from "react";
import { Button, Box, Typography } from "@mui/material";

const DeleteAccount = () => (
  <Box>
    <Typography variant="h6" color="error">Danger Zone</Typography>
    <Typography>Once deleted, your account cannot be recovered.</Typography>
    <Button variant="contained" color="error" sx={{ mt: 2 }}>Delete My Account</Button>
  </Box>
);

export default DeleteAccount;