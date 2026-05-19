const express = require('express');
const router = express.Router();
const { Notification } = require('../../db/models');

// Fetch notifications for a user/role
router.get('/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    // For admin, we just use role='admin' and userId='admin' for simplicity
    const query = { role, userId };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Get recent 50
      
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark single notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark all notifications as read for a user
router.put('/:role/:userId/read-all', async (req, res) => {
  try {
    const { role, userId } = req.params;
    await Notification.updateMany({ role, userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Clear/delete all notifications for a user
router.delete('/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    await Notification.deleteMany({ role, userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
