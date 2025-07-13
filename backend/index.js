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
  videocallSchem,
  connectToDatabase,
} = require("./db/models");

const appointmentRouter = require("./routes/appointment.js");
const doctorRouter = require("./routes/doctor.js");
const patientRouter = require("./routes/patient.js");
const feespayRouter = require("./routes/feespay.js");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const newsRoute = require('./routes/newsRoute');
const paypalRoute = require('./routes/paypal');
const summary = require('./routes/videoCall');
const auth = require("./middleware/authMiddleware");
const analysis = require('./routes/analytics');
const aiprescript = require("./routes/ai");

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
    origin:'*',
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.use("/prescriptions", auth, prescriptionRoutes); 
app.use("/feespay", auth, feespayRouter); 
app.use("/doctor", doctorRouter);
app.use("/appointment", auth, appointmentRouter);;
app.use("/patient", patientRouter);
app.use('/api/news', newsRoute);
app.use('/api/paypal', paypalRoute);
app.use('/api/videocall', summary);
app.use('/api/analytics', analysis);
app.use('/api/ai',aiprescript)


io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.onAny((event, ...args) => {
    console.log(`Event received: ${event}`, args);
  });

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });



  socket.on("end-call", ({ roomId }) => {
    socket.to(roomId).emit("end-call");
    socket.leave(roomId);
  });

  socket.on("appointment-update", () => {
    io.emit("appointment-updated");
  });

  const python = spawn("python", ["transcriber.py"]);

  socket.on("audio-stream", (data) => {
    if (python.stdin.writable) {
      python.stdin.write(Buffer.from(data));
    }
  });

  python.stdout.on("data", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      socket.emit("transcript", parsed);
    } catch (err) {
      console.error("Failed to parse transcript:", err);
    }
  });

  

  socket.on("disconnect", () => {
    python.kill();
    console.log("User disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
