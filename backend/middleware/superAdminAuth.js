module.exports = (req, res, next) => {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({ message: "Super Admin only" });
  }
  next();
};
