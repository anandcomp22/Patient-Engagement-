const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Admin = require("../../db/models").Admin;
const bcrypt = require("bcryptjs");
const adminAuth = require("../../middleware/adminAuth");
//const { generateToken } = require("../../utils/auth");
require("dotenv").config();
const JWT_SECRET_ADMIN = "adminsecretjwtkey456";

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const trimmedEmail = email?.trim().toLowerCase();

  console.log("Admin login attempt:", trimmedEmail);

  const admin = await Admin.findOne({ email: trimmedEmail });
  if (!admin) {
    console.log("Admin not found:", trimmedEmail);
    return res.status(404).json({ message: "Admin not found" });
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    console.log("Invalid credentials for admin:", trimmedEmail);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ adminId: admin._id, role: admin.role }, JWT_SECRET_ADMIN, { expiresIn: "7d" });

  res.json({
    token,
    admin: {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role
    }
  });
});

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, dob, phone, email, password, role } = req.body;
    const trimmedEmail = email?.trim().toLowerCase();

    const exists = await Admin.findOne({ email: trimmedEmail });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const adminCount = await Admin.countDocuments();
    const createdBy = adminCount === 0 ? null : req.admin?.adminId;

    const newAdmin = new Admin({
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      dob,
      phone: phone?.trim(),
      email: trimmedEmail,
      password,
      role: adminCount === 0 ? "superadmin" : "admin",
      createdBy
    });

    await newAdmin.save();
    console.log("Admin registered successfully:", trimmedEmail);

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
