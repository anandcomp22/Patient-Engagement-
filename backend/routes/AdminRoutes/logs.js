const router = require("express").Router();
const adminAuth = require("../../middleware/adminAuth");
const AdminLog = require("../../db/models").AdminLog;

router.get("/", adminAuth, async (req, res) => {
  const logs = await AdminLog.find()
    .populate("adminId", "email")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(logs);
});

module.exports = router;
