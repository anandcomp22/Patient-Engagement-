const express = require('express');
const cors= require('cors');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

const {prescription,doctor,feepay,appointment,connectToDatabase} = require('./db/models');
const {appointmentRouter} = require('./routes/appointment.js');
const {doctorRouter} = require('./routes/doctor.js');
const {feespayRouter} = require('./routes/feespay.js');
const { prescriptionRouter } = require('./routes/prescription.js');

connectToDatabase();
app.use(express.json());
app.use(cors());
app.get('/', async (req, res) => {
    await prescription.updateMany({});
    res.send("Hello World");
});
app.use('/prescription', prescriptionRouter);
app.use('/feespay', feespayRouter);
app.use('/doctor', doctorRouter);
app.use('/appointment', appointmentRouter);

app.listen(3000, () => {
    console.log("server started at port 3000");
});