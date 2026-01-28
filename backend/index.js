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
const summary = require('./routes/DoctorRoutes/videoCall.js');
const auth = require("./middleware/authMiddleware");
const analysis = require('./routes/DoctorRoutes/analytics.js');
const aiprescript = require("./routes/ChatBotRoutes/ai.js");
const RAGRoutes = require("./routes/RAGRoutes/RAGRoutes.js");
const adminDashboard = require("./routes/AdminRoutes/dashboard");
const adminDoctors = require("./routes/AdminRoutes/adminDoctors");
const adminRoutes = require("./routes/AdminRoutes/admin");
const adminAppointments = require("./routes/AdminRoutes/appointments");
const adminPayments = require("./routes/AdminRoutes/payments");
const adminAnalytics = require("./routes/AdminRoutes/analytics");
const adminLogs = require("./routes/AdminRoutes/logs");
//const adminAdmins = require("./routes/AdminRoutes/admin");
const adminAuthRoutes = require("./routes/AdminRoutes/auth");

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

app.set("io", io);
app.use("/prescriptions", auth, prescriptionRoutes); 
app.use("/feespay", auth, feespayRouter); 
app.use("/doctor", doctorRouter); 
app.use("/appointment", auth, appointmentRouter);
app.use("/patient", patientRouter);
app.use('/api/news', newsRoute);
app.use('/api/paypal', paypalRoute);
app.use('/api/videocall', summary);
app.use('/api/analytics', analysis);
app.use('/api/ai',aiprescript)
app.use("/rag", RAGRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/admin/dashboard", adminDashboard);
app.use("/admin/doctors", adminDoctors);
app.use("/admin/appointments", adminAppointments);
app.use("/admin", adminRoutes);
app.use("/admin/payments", adminPayments);
app.use("/admin/analytics", adminAnalytics);
app.use("/slot", patientRouter);
app.use("/payment", patientRouter);
app.use("/appointment", patientRouter);
app.use("/admin/logs", adminLogs);
//app.use("/admin/admin", adminAdmins);
app.use("/admin/auth", adminAuthRoutes);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.onAny((event, ...args) => {
    console.log(`Event received: ${event}`, args);
  });

  socket.on("join-room", ({ roomId, role }) => {
    socket.join(roomId);

    socket.to(roomId).emit("peer-joined", { role });
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

  /*socket.on("appointment-update", () => {
    io.emit("appointment-updated");
  });*/

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


const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
