const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Appointment, FeePay } = require("../../db/models");

// Monthly Revenue
router.get("/monthly-revenue", adminAuth, async (req, res) => {
  const data = await FeePay.aggregate([
    { $match: { paymentstatus: "paid" } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$fees" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
  res.json(data);
});

// Doctor-wise Appointments
router.get("/doctor-wise", adminAuth, async (req, res) => {
  const data = await Appointment.aggregate([
    {
      $group: {
        _id: "$doctorId",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "doctors",
        localField: "_id",
        foreignField: "_id",
        as: "doctor"
      }
    },
    { $unwind: "$doctor" },
    {
      $project: {
        doctorName: "$doctor.name",
        count: 1
      }
    }
  ]);
  res.json(data);
});

module.exports = router;
