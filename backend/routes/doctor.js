const express = require('express');
const router = express.Router();
const { exec } = require("child_process");
const Appointments = require("../db/models")

router.get('/appointment', async (req, res) => {
    console.log("Getting Appointment data");
    try{
        const appointment = await Appointments.find();
        if (!appointment){
            res.status(200).json({message : "Appointments Not found"})
        }

        res.status(200).json(appointment);

    }catch(err){
        res.status(500).json({
            status : false,
            message : "Error in fetching Appointments"
        })
    }

});

router.get("/prescriptions", async(req,res)=>{
    console.log("Getting Prescription Data");
    try{
        exec(`python C:\\Users\\HP\\Patient-Engagement-\\backend\\optimized_test.py`, (error, stdout, stderr) => {
            if (error || stderr) {
                return res.status(500).json({ error: error?.message || stderr });
            }
            try {
                const output = JSON.parse(stdout);
                res.json({ message: "Request successful", data: output });
            } catch (parseError) {
                res.status(500).json({ error: "Invalid JSON response from Python script" });
            }
        });

    }catch(err){
        res.status(500).json({
            status : false,
            message : "Error in fetching Prescriptions"
        })
    }
})

module.exports = router;

