const jwt = require("jsonwebtoken");
const {Doctor} = require("../db/models");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doctor = await Doctor.findById(decoded.id).select("-password");
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    req.user = {
    doctorId: doctor.doctorId,
    id: doctor._id,
    email: doctor.email,
  };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
