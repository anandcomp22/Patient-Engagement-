const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { spawn } = require("child_process");
//require("../backend/cron/unlockSlots");
const { Prescription, Doctor, FeePay, Appointment, Patient, videocallSchem, connectToDatabase,
} = require("./db/models");


const appointmentRouter = require("./routes/DoctorRoutes/appointment.js");
const doctorRouter = require("./routes/DoctorRoutes/doctor.js");
const patientRouter = require("./routes/PatientRoutes/patient.js");
const feespayRouter = require("./routes/PaymentRoutes/feespay.js");
const prescriptionRoutes = require("./routes/DoctorRoutes/prescriptionRoutes.js");
const newsRoute = require('./routes/DoctorRoutes/newsRoute.js');
const paypalRoute = require('./routes/PaymentRoutes/paypal.js');
const stripeRoute = require('./routes/PaymentRoutes/stripe.js');
const summary = require('./routes/DoctorRoutes/videoCall.js');
const auth = require("./middleware/authMiddleware");
const analysis = require('./routes/DoctorRoutes/analytics.js');
const aiprescript = require("./routes/ChatBotRoutes/ai.js");
const RAGRoutes = require("./routes/RAGRoutes/RAGRoutes.js");
const adminDashboard = require("./routes/AdminRoutes/dashboard");
const adminDoctors = require("./routes/AdminRoutes/adminDoctors");
const adminAppointments = require("./routes/AdminRoutes/appointments");
const adminPayments = require("./routes/AdminRoutes/payments");
const adminAnalytics = require("./routes/AdminRoutes/analytics");
const adminLogs = require("./routes/AdminRoutes/logs");
const adminVerifyRoutes = require("./routes/AdminRoutes/admin");
const adminAuthRoutes = require("./routes/AdminRoutes/auth");
const adminPatients = require("./routes/AdminRoutes/adminPatients");

const app = express();
app.use(cors());
app.use(express.json());

connectToDatabase();

const prescriptionsDir = path.join(__dirname, "prescriptions");
if (!fs.existsSync(prescriptionsDir)) {
  fs.mkdirSync(prescriptionsDir);
}

const reportsDir = path.join(__dirname, "uploads", "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
app.use("/prescriptions", auth, prescriptionRoutes);
app.use("/feespay", auth, feespayRouter);
app.use("/doctor", doctorRouter);
app.use("/appointment", auth, appointmentRouter);
app.use("/patient", patientRouter);
app.use('/api/news', newsRoute);
app.use('/api/paypal', paypalRoute);
app.use('/api/stripe', stripeRoute);
app.use('/api/videocall', summary);
app.use('/api/analytics', analysis);
app.use('/api/ai', aiprescript)
app.use("/rag", RAGRoutes);
app.use("/admin/dashboard", adminDashboard);
app.use("/admin/doctors", adminDoctors);
app.use("/admin/appointments", adminAppointments);
app.use("/admin/payments", adminPayments);
app.use("/admin/analytics", adminAnalytics);
app.use("/slot", patientRouter);
app.use("/payment", patientRouter);
//app.use("/appointment", patientRouter);
app.use("/admin/logs", adminLogs);
app.use("/admin/verify", adminVerifyRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/admin/patients", adminPatients);


app.use("/uploads", express.static("uploads"));


const readyPeers = {}; // { roomId: { doctor: {...}, patient: {...} } }
const lobbyPeers = {}; // { roomId: { doctor: {...}, patient: {...} } }

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.onAny((event, ...args) => {
    console.log(`Event received: ${event}`, args);
  });

  socket.on("lobby-join", async ({ roomId, role, userName }) => {
    socket.join(roomId);
    if (!lobbyPeers[roomId]) lobbyPeers[roomId] = {};
    lobbyPeers[roomId][role] = { socketId: socket.id, userName };

    console.log(`[Lobby] ${role} (${userName}) joined room ${roomId}`);

    // Notify others in the lobby
    io.to(roomId).emit("lobby-status", {
      doctorPresent: !!lobbyPeers[roomId].doctor,
      patientPresent: !!lobbyPeers[roomId].patient,
      lobbyParticipants: lobbyPeers[roomId]
    });

    // If both are in lobby, mark appointment as ACTIVE
    if (lobbyPeers[roomId].doctor && lobbyPeers[roomId].patient) {
      try {
        const { Appointment } = require("./db/models");
        await Appointment.findByIdAndUpdate(roomId, { callStatus: "ACTIVE" });
        console.log(`[Lobby] Appointment ${roomId} activated!`);
      } catch (err) {
        console.error("Failed to activate appointment:", err);
      }
    }
  });

  socket.on("lobby-leave", ({ roomId, role }) => {
    socket.leave(roomId);
    if (lobbyPeers[roomId] && lobbyPeers[roomId][role]) {
      const userName = lobbyPeers[roomId][role].userName;
      delete lobbyPeers[roomId][role];
      console.log(`[Lobby] ${role} (${userName}) left room ${roomId} (Changed Room)`);

      io.to(roomId).emit("lobby-status", {
        doctorPresent: !!lobbyPeers[roomId].doctor,
        patientPresent: !!lobbyPeers[roomId].patient,
        lobbyParticipants: lobbyPeers[roomId]
      });

      if (Object.keys(lobbyPeers[roomId]).length === 0) {
        delete lobbyPeers[roomId];
      }
    }
  });

  socket.on("lobby-ping", ({ roomId, role, userName }) => {
    socket.join(roomId); // Ensure socket is definitely in the room
    if (!lobbyPeers[roomId]) lobbyPeers[roomId] = {};

    // If they were not present, or socket ID changed, update and broadcast
    if (!lobbyPeers[roomId][role] || lobbyPeers[roomId][role].socketId !== socket.id) {
      lobbyPeers[roomId][role] = { socketId: socket.id, userName };
      io.to(roomId).emit("lobby-status", {
        doctorPresent: !!lobbyPeers[roomId].doctor,
        patientPresent: !!lobbyPeers[roomId].patient,
        lobbyParticipants: lobbyPeers[roomId]
      });
    } else {
      // Just reply directly to them to guarantee their UI is perfectly in sync
      socket.emit("lobby-status", {
        doctorPresent: !!lobbyPeers[roomId].doctor,
        patientPresent: !!lobbyPeers[roomId].patient,
        lobbyParticipants: lobbyPeers[roomId]
      });
    }
  });

  socket.on("lobby-start-call", ({ roomId }) => {
    console.log(`[Lobby] Doctor started call in room ${roomId}. Signaling all participants...`);
    io.to(roomId).emit("lobby-call-started", { roomId });
  });

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("media-ready", ({ roomId, role, userName, patientId }) => {
    console.log(`[Socket] media-ready received! Room: ${roomId}, Role: ${role}, Name: ${userName || "?"}, PatientId: ${patientId || "N/A"}`);
    socket.join(roomId);
    if (!readyPeers[roomId]) readyPeers[roomId] = {};
    readyPeers[roomId][role] = { socketId: socket.id, userName: userName || "Unknown", patientId: patientId || "" };

    // Tell everyone else in the room (with participant info)
    socket.to(roomId).emit("peer-ready", { role, userName: userName || "Unknown", patientId: patientId || "" });

    // Tell the new person about existing people
    Object.keys(readyPeers[roomId]).forEach(existingRole => {
      if (existingRole !== role) {
        const info = readyPeers[roomId][existingRole];
        socket.emit("peer-ready", { role: existingRole, userName: info.userName, patientId: info.patientId });
      }
    });
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

  socket.on("user-left", ({ roomId, role, userName }) => {
    socket.to(roomId).emit("user-left", { role, userName: userName || "Someone" });
    socket.leave(roomId);

    // Clean up readyPeers
    if (readyPeers[roomId]) {
      delete readyPeers[roomId][role];
      if (Object.keys(readyPeers[roomId]).length === 0) delete readyPeers[roomId];
    }

    // Clean up lobbyPeers
    if (lobbyPeers[roomId]) {
      delete lobbyPeers[roomId][role];
      io.to(roomId).emit("lobby-status", {
        doctorPresent: !!lobbyPeers[roomId].doctor,
        patientPresent: !!lobbyPeers[roomId].patient,
        lobbyParticipants: lobbyPeers[roomId]
      });
      if (Object.keys(lobbyPeers[roomId]).length === 0) delete lobbyPeers[roomId];
    }
  });

  socket.on("disconnect", () => {
    // Clean up any lingering presence for this socket in lobbyPeers
    for (const roomId in lobbyPeers) {
      for (const role in lobbyPeers[roomId]) {
        if (lobbyPeers[roomId][role].socketId === socket.id) {
          delete lobbyPeers[roomId][role];
          io.to(roomId).emit("lobby-status", {
            doctorPresent: !!lobbyPeers[roomId].doctor,
            patientPresent: !!lobbyPeers[roomId].patient,
            lobbyParticipants: lobbyPeers[roomId]
          });
          if (Object.keys(lobbyPeers[roomId]).length === 0) delete lobbyPeers[roomId];
        }
      }
    }

    // Clean up any lingering presence for this socket in readyPeers
    for (const roomId in readyPeers) {
      for (const role in readyPeers[roomId]) {
        if (readyPeers[roomId][role].socketId === socket.id) {
          delete readyPeers[roomId][role];
          socket.to(roomId).emit("user-left", { role, userName: "Someone" });
          if (Object.keys(readyPeers[roomId]).length === 0) delete readyPeers[roomId];
        }
      }
    }
  });

  /*socket.on("appointment-update", () => {
    io.emit("appointment-updated");
  });*/

  /*const python = spawn("python", ["transcriber.py"]);

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
  });*/
});


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);

  // ── Activate Cron Jobs ──
  require("./crons/unlockSlots");
  require("./crons/activateCall");
  require("./crons/appointmentReminder")(io);
  console.log("[Server] ✅ All cron jobs activated");
});

