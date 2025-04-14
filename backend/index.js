const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { spawn } = require("child_process");

const {
  Prescription,
  Doctor,
  FeePay,
  Appointment,
  Patient,
  connectToDatabase,
} = require("./db/models");

const appointmentRouter = require("./routes/appointment.js");
const doctorRouter = require("./routes/doctor.js");
const patientRouter = require("./routes/patient.js");
const feespayRouter = require("./routes/feespay.js");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const newsRoute = require('./routes/newsRoute');

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
    methods: ["GET", "POST"],
  },
});

// API Routes
app.use("/prescriptions", prescriptionRoutes);
app.use("/feespay", feespayRouter);
app.use("/doctor", doctorRouter);
app.use("/appointment", appointmentRouter);
app.use("/patient", patientRouter)
app.use('/api/news', newsRoute);

// Socket.io video call + DeepSpeech handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Video call signaling
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

  // DeepSpeech integration
  const python = spawn("python3", ["deepspeech_streamer.py"]);

  socket.on("audio-stream", (data) => {
    if (python.stdin.writable) {
      python.stdin.write(Buffer.from(data));
    }
  });

  python.stdout.on("data", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      socket.emit("transcript", parsed); // emits { text, condition, recommendations }
    } catch (err) {
      console.error("Failed to parse DeepSpeech output:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (python) python.kill();
  });
});

// Start server
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
