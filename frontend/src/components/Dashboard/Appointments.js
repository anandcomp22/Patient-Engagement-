import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import React from 'react';
import "./Appointments.css";

const Appointment = [
    {
        name: "John Deo",
        condition: "Guiding on Hypertension and Type 2 Diabetes"
    },

    {
        name: "Emily Johnson",
        condition: "initial consultation on Anxiety and Chronic Migraines"
    },

    {
        name: "Robert Smith",
        condition: "Consultation on Type 2 Diabetes Hyperlipidemia and Osteoarthritis"
    },

    {
        name:"Maria Garcia",
        conddition:" Guiding on Severe Allergies and Asthma"
    },
]

const Appointments = () => {
    return (
        <Box sx={{ padding: 3, mt: 5}}>
            {/* Filter & add Appointment Section*/}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb:4}}>
                {/*Header section*/}
                <Box sx={{ mb:4 }}>
                    <Typography variant="h5" fontWeight="bold">Appointments</Typography>
                </Box>
                {/* Buttons on right*/}
                <Box sx={{display: "flex", gap: 2}}>
                    <Button className = "buttoncolor" variant="outlined" startIcon={<FilterListIcon/>} sx={{textTransform:"none"}}>
                    Filter
                    </Button>
                    <Button className = "buttoncolor" variant="contained" startIcon={<AddIcon/>} sx={{textTransform: "none"}}>
                    Add Appointment
                    </Button>
                </Box>
            </Box>


        </Box>
    )
};

export default Appointments; 