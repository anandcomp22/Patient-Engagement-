const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const { Appointment, FeePay, Doctor } = require("../../db/models");

// Monthly Revenue (with real month names)
router.get("/monthly-revenue", adminAuth, async (req, res) => {
  try {
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

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result = data.map(d => ({
      month: monthNames[d._id - 1],
      revenue: d.total
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch monthly revenue" });
  }
});

// Doctor-wise Appointments
router.get("/doctor-wise", adminAuth, async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      { $group: { _id: "$doctorId", count: { $sum: 1 }, doctorName: { $first: "$doctorName" } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(data.map(d => ({ doctorName: d.doctorName || `Dr. #${d._id}`, count: d.count })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctor-wise data" });
  }
});

// Specialty breakdown (pie chart)
router.get("/specialty-breakdown", adminAuth, async (req, res) => {
  try {
    const data = await Doctor.aggregate([
      { $group: { _id: "$specialty", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(data.map(d => ({ specialty: d._id || "Unknown", count: d.count })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch specialty data" });
  }
});

// Daily appointments (last 30 days)
router.get("/daily-appointments", adminAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(data.map(d => ({ date: d._id, count: d.count })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch daily appointments" });
  }
});

module.exports = router;
