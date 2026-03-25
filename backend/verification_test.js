const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Define Admin Schema for testing
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "superadmin"], default: "admin" }
});

AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

AdminSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const Admin = mongoose.model("AdminTest", AdminSchema);

async function verify() {
  try {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/aidme";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    const testEmail = "testadmin@example.com";
    const testPassword = "password123";

    // 1. Cleanup
    await Admin.deleteMany({ email: testEmail });
    console.log("Cleanup done");

    // 2. Register
    const newAdmin = new Admin({
      email: "  " + testEmail + "  ", // Test trimming
      password: testPassword,
      role: "admin"
    });
    await newAdmin.save();
    console.log("Admin registered (with spaces in email)");

    // 3. Login
    const foundAdmin = await Admin.findOne({ email: testEmail.trim().toLowerCase() });
    if (!foundAdmin) throw new Error("Admin not found after registration");
    console.log("Admin found in DB");

    const isMatch = await foundAdmin.comparePassword(testPassword);
    if (isMatch) {
      console.log("SUCCESS: Password matched!");
    } else {
      throw new Error("FAILURE: Password did not match!");
    }

    // 4. Test wrong password
    const isMatchWrong = await foundAdmin.comparePassword("wrongpassword");
    if (!isMatchWrong) {
      console.log("SUCCESS: Wrong password rejected!");
    } else {
      throw new Error("FAILURE: Wrong password accepted!");
    }

    await Admin.deleteMany({ email: testEmail });
    await mongoose.disconnect();
    console.log("Verification completed successfully");
  } catch (err) {
    console.error("Verification FAILED:", err.message);
    process.exit(1);
  }
}

verify();
