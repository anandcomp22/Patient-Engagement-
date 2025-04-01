const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { Prescription, Doctor, FeePay, Appointment, connectToDatabase } = require("./db/models");
const appointmentRouter = require("./routes/appointment.js");
const doctorRouter = require("./routes/doctor.js");
const feespayRouter = require("./routes/feespay.js");
const prescriptionRoutes = require("./routes/prescriptionRoutes");



const app = express();
app.use(cors());
app.use(express.json());

connectToDatabase();

const prescriptionsDir = path.join(__dirname, "prescriptions");
if (!fs.existsSync(prescriptionsDir)) {
  fs.mkdirSync(prescriptionsDir);
}


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// API Routes
app.use("/prescriptions", prescriptionRoutes);
app.use("/feespay", feespayRouter);
app.use("/doctor", doctorRouter);
app.use("/appointment", appointmentRouter);

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

    socket.on("end-call", () => {
        io.emit("end-call"); 
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Start Server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});

