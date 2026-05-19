const { Notification } = require("../db/models");

/**
 * Send a real-time notification and save it to the DB.
 * 
 * @param {Object} io - The socket.io server instance
 * @param {String} userId - The ID of the user (or 'admin')
 * @param {String} role - 'patient', 'doctor', or 'admin'
 * @param {String} title - Notification title
 * @param {String} message - Notification body
 */
const sendNotification = async (io, userId, role, title, message) => {
  try {
    const notif = new Notification({
      userId: userId.toString(),
      role,
      title,
      message,
    });
    
    await notif.save();
    
    // Emit to the specific user's notification room
    const room = `notify_${role}_${userId}`;
    io.to(room).emit("new-notification", notif);
    
    console.log(`[Notification] Sent to ${room}: ${title}`);
  } catch (err) {
    console.error("[Notification] Error saving/sending notification:", err);
  }
};

module.exports = { sendNotification };
