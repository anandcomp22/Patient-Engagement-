const jwt = require("jsonwebtoken");
const Admin = require("../db/models").Admin;
require("dotenv").config();

const JWT_SECRET_ADMIN = "adminsecretjwtkey456";

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET_ADMIN);

    req.admin = {
      adminId: decoded.adminId,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
