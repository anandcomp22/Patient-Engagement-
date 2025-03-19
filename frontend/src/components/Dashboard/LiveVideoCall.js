import React from 'react';
import { Box, Grid, Typography, Card, CardContent, Avatar, TextField, Button, Chip, Divider, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Video, Mic, PhoneCall, MessageCircle, NotepadText, ChartNoAxesGantt } from "lucide-react";

const LiveVideoCall = () => {
  return (
    <Box>
    <Box sx={{ padding:4, mt:3, width:"75%"}}>
      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:0, gap:1}}>
            <Avatar sx={{ bgcolor: "#007BFF" }}>
              <PersonIcon/>
            </Avatar>
            <Box>
              <Typography variant="body1" fontWeight="bold">Prathmesh Vharkal</Typography>
              <Typography variant="body2" color="text.secondary">
                20 years, Male  
              </Typography> 
            </Box>
            <Box sx={{ display: "flex", alignItems: "cemter", gap: 2}}>
            <Chip label="Live" color="primary" variant="outlined" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">10:30</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2, mt:0.5}}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:55, gap:1}}>

          </Box>
        </CardContent>
      </Card>

      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2, mt:0}}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:2, gap:2}}>
            <Avatar><Mic/></Avatar>
            <Avatar><Video/></Avatar>
            <Avatar><PhoneCall color='red'/></Avatar>
            <Avatar><MessageCircle/></Avatar>
            <Avatar><NotepadText/></Avatar>
          </Box>
        </CardContent>
      </Card>
    </Box>

    

    <Box sx={{ padding:4, mt:3, width:"25%"}}>
      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:0, gap:1}}>
            <ChartNoAxesGantt/>
            <Typography fontWeight="Bold" fontSize="15px">Prescription Generator</Typography>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2, mt:0.5}}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:55, gap:1}}>

          </Box>
        </CardContent>
      </Card>

      <Card sx={{ display: "flex", flexDirection: "column", boxShadow: 2, mt:0}}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems:"center", mb:2, gap:2}}>
            
          </Box>
        </CardContent>
      </Card>
    </Box>

    </Box>

)
};
export default LiveVideoCall;