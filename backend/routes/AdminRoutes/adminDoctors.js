const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Doctor } = require("../../db/models");
const adminLogger = require("../../middleware/adminLogger");


router.patch("/doctors/:id/:action",adminAuth,
  adminLogger("DOCTOR_VERIFICATION", "Doctor"),
  async (req, res) => {
    const { id, action } = req.params;

    const actionMap = {
      approve: { isVerified: true, status: "APPROVED" },
      reject: { isVerified: false, status: "REJECTED" },
      suspend: { isVerified: false, status: "SUSPENDED" }
    };

    if (!actionMap[action]) {
      return res.status(400).json({ message: "Invalid action" });
    }

    try {
      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: actionMap[action] },
        { new: true }
      );

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json({
        message: `Doctor ${action}d successfully`,
        doctor
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


router.get("/doctors", adminAuth, async (req, res) => {
  const doctors = await Doctor.find().select("-password");
  res.json(doctors);
});

module.exports = router; 