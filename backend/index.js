const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();


const { Prescription, Doctor, FeePay, Appointment, connectToDatabase } = require('./db/models');
const appointmentRouter = require('./routes/appointment.js');
const doctorRouter = require('./routes/doctor.js');
const feespayRouter = require('./routes/feespay.js');
const prescriptionRouter = require('./routes/prescription.js');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

connectToDatabase();

app.use(express.json());
app.use(cors());

app.get('/', async (req, res) => {
    await prescription.updateMany({});
    res.send("Hello World");
});


console.log("appointmentRouter:", appointmentRouter);
console.log("doctorRouter:", doctorRouter);
console.log("feespayRouter:", feespayRouter);
console.log("prescriptionRouter:", prescriptionRouter);

// API Routes
app.use('/prescription', prescriptionRouter);
app.use('/feespay', feespayRouter);
app.use('/doctor', doctorRouter);
app.use('/appointment', appointmentRouter);

// WebRTC Signaling for Video Call
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
        socket.broadcast.emit("ice-candidate", candidate);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});


server.listen(3000, () => {
    console.log("Server started at http://localhost:3000");
});
