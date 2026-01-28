const AdminLog = require("../db/models").AdminLog;

module.exports = (action, entity) => async (req, res, next) => {
  res.on("finish", async () => {
    try {
      if (!req.admin || !req.admin.adminId) return; 

      await AdminLog.create({
        adminId: req.admin.adminId,
        action,
        entity,
        ip: req.ip
      });
    } catch (err) {
      console.error("AdminLog error:", err.message);
    }
  });
  next();
};
