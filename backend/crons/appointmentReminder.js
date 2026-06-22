const { Appointment, Doctor, videocall } = require("../db/models");
const { sendEmail } = require("../utils/mailer");

/**
 * Appointment Reminder Cron
 * Runs every 2 minutes. Finds appointments starting in the next 15 minutes
 * that haven't been reminded yet, sends email + socket notification.
 * 
 * @param {SocketIO.Server} io - Socket.IO server instance for real-time toasts
 */
module.exports = function startReminderCron(io) {
  console.log("[Cron] ⏰ Appointment reminder cron started (every 2 min)");

  setInterval(async () => {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find today's confirmed appointments that haven't been reminded
      const appointments = await Appointment.find({
        appointmentDate: { $gte: today, $lt: tomorrow },
        appstatus: "confirmed",
        reminderSent: { $ne: true }
      });

      for (const appt of appointments) {
        // Parse the startTime (e.g. "10:00 AM") into today's Date
        if (!appt.startTime) continue;

        const [timePart, modifier] = appt.startTime.trim().split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        const apptDateTime = new Date(appt.appointmentDate);
        apptDateTime.setHours(hours, minutes, 0, 0);

        const diffMs = apptDateTime - now;
        const diffMin = diffMs / (1000 * 60);

        console.log(`[Cron Debug] Checking appt ${appt._id}: ${appt.startTime} on ${appt.appointmentDate.toISOString()}. Now: ${now.toISOString()}. Diff: ${Math.round(diffMin)} min`);

        // Only remind if appointment is 0-15 minutes away (not past)
        if (diffMin > 0 && diffMin <= 15) {
          console.log(`[Cron] 🔔 Sending reminder for appointment ${appt._id} (${appt.patientName} with ${appt.doctorName}) in ${Math.round(diffMin)} min`);

          // Get video call room
          const vc = await videocall.findOne({ appointmentId: appt._id });
          const roomId = vc?.roomId || "";
          const videoLink = `http://localhost:3000/patient/video-call?roomId=${roomId}`;
          const doctorVideoLink = `http://localhost:3000/doctor/video-call?roomId=${roomId}&patientEmail=${encodeURIComponent(appt.patientEmail)}&patientName=${encodeURIComponent(appt.patientName)}&patientId=${appt.patientId}`;

          // ── Email to Patient ──
          try {
            await sendEmail(
              appt.patientEmail,
              `⏰ Reminder: Your consultation with ${appt.doctorName} starts in ${Math.round(diffMin)} minutes!`,
              `<div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
                <h2 style="color:#1E5DA9;">Appointment Reminder</h2>
                <p>Dear <strong>${appt.patientName}</strong>,</p>
                <p>Your video consultation with <strong>${appt.doctorName}</strong> starts in <strong>${Math.round(diffMin)} minutes</strong>.</p>
                <p><strong>Time:</strong> ${appt.startTime}</p>
                <a href="${videoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px;">Join Now</a>
                <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px;">AidME Healthcare — Please join on time for the best experience.</p>
              </div>`
            );
          } catch (e) {
            console.error(`[Cron] Patient reminder email failed:`, e.message);
          }

          // ── Email to Doctor ──
          try {
            const doctor = await Doctor.findOne({ doctorId: appt.doctorId });
            if (doctor?.email) {
              await sendEmail(
                doctor.email,
                `⏰ Reminder: Consultation with ${appt.patientName} in ${Math.round(diffMin)} minutes`,
                `<div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
                  <h2 style="color:#1E5DA9;">Consultation Reminder</h2>
                  <p>Your appointment with <strong>${appt.patientName}</strong> starts in <strong>${Math.round(diffMin)} minutes</strong>.</p>
                  <p><strong>Time:</strong> ${appt.startTime} | <strong>Reason:</strong> ${appt.reason || "General Checkup"}</p>
                  <a href="${doctorVideoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px;">Join Call</a>
                </div>`
              );
            }
          } catch (e) {
            console.error(`[Cron] Doctor reminder email failed:`, e.message);
          }

          // ── Socket.IO Real-time Toast ──
          if (io) {
            io.emit("appointment-reminder", {
              appointmentId: appt._id,
              patientName: appt.patientName,
              patientId: appt.patientId,
              doctorName: appt.doctorName,
              doctorId: appt.doctorId,
              startTime: appt.startTime,
              minutesAway: Math.round(diffMin),
              roomId,
            });
          }

          // ── Mark as reminded ──
          await Appointment.updateOne(
            { _id: appt._id },
            { $set: { reminderSent: true } }
          );
        }
      }
    } catch (err) {
      console.error("[Cron] Reminder cron error:", err.message);
    }
  }, 2 * 60 * 1000); // Every 2 minutes
};
