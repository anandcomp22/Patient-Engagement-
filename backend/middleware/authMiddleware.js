const jwt = require("jsonwebtoken");
const {Doctor, Patient} = require("../db/models");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "patient" || decoded.patientId) {
      const patientIdFromToken = decoded.patientId;
      const queryPatientId = Number(patientIdFromToken);
      const patient = await Patient.findOne({ patientId: queryPatientId }).select("-password");
      if (!patient) return res.status(404).json({ message: "Patient not found" });

      req.user = {
        patientId: patient.patientId,
        mongoId: patient._id,
        email: patient.email,
        role: "patient"
      };
      return next();
    }

    const doctorIdFromToken = decoded.doctorId;
    if (!doctorIdFromToken) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const queryDoctorId = Number(doctorIdFromToken);
    const doctor = await Doctor.findOne({ doctorId: queryDoctorId }).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    
    req.user = {
      doctorId: doctor.doctorId,
      mongoId: doctor._id,
      email: doctor.email,
      role: decoded.role || "doctor"
    };

    next(); 
  } catch (err) {
    console.error("Auth error details:", err.message, err.stack);
    return res.status(401).json({ message: "Invalid token details: " + err.message, stack: err.stack });
  }
};

module.exports = authMiddleware;
