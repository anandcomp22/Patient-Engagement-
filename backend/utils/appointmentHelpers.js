const { sendEmail } = require("./mailer");

async function sendAppointmentConfirmation(appointment, patient, doctor, roomId) {
  const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const time = appointment.startTime;
  const reason = appointment.reason;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const videoLink = `${frontendUrl}/patient/video-call?roomId=${roomId}`;
  const doctorVideoLink = `${frontendUrl}/doctor/video-call?roomId=${roomId}&patientEmail=${encodeURIComponent(patient.email)}&patientName=${encodeURIComponent(patientName)}&patientId=${patient.patientId}`;

  // Email to Patient
  try {
    await sendEmail(
      patient.email,
      `Appointment Confirmed — ${doctorName} on ${formattedDate}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;border:1px solid #e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#1E5DA9;margin-bottom:4px;">AidME Healthcare</h2>
        <p style="color:#64748b;margin-top:0;">Appointment Confirmation</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;"/>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#64748b;">Doctor</td><td style="padding:8px 0;font-weight:700;">${doctorName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Specialty</td><td style="padding:8px 0;">${doctor.specialty}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:700;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;font-weight:700;">${time}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;">${reason || "General Checkup"}</td></tr>
        </table>
        <a href="${videoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">Join Video Consultation</a>
        <p style="color:#94a3b8;font-size:0.8rem;margin-top:16px;">The join link will be active at your scheduled time. You'll also receive a reminder 10 minutes before.</p>
      </div>`
    );
  } catch (emailErr) {
    console.error("[Booking] Patient confirmation email failed:", emailErr.message);
  }

  // Email to Doctor
  try {
    await sendEmail(
      doctor.email,
      `New Appointment: ${patientName} on ${formattedDate} at ${time}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;border:1px solid #e2e8f0;padding:24px;border-radius:12px;">
        <h2 style="color:#1E5DA9;">New Appointment Scheduled</h2>
        <p>A new consultation has been booked for you:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#64748b;">Patient</td><td style="padding:8px 0;font-weight:700;">${patientName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Date</td><td style="padding:8px 0;font-weight:700;">${formattedDate}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Time</td><td style="padding:8px 0;font-weight:700;">${time}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Reason</td><td style="padding:8px 0;">${reason || "General Checkup"}</td></tr>
        </table>
        <a href="${doctorVideoLink}" style="display:inline-block;background:#1E5DA9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Join Call (at scheduled time)</a>
      </div>`
    );
  } catch (emailErr) {
    console.error("[Booking] Doctor confirmation email failed:", emailErr.message);
  }
}

module.exports = { sendAppointmentConfirmation };
