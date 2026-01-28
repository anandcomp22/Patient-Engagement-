import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-video-link", async (req, res) => {
  const { email, link, doctorName } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AidME" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your Video Consultation Link",
    html: `
      <p>Hello,</p>
      <p>Your video consultation with <b>Dr. ${doctorName}</b> is ready.</p>
      <p><a href="${link}">Join Video Call</a></p>
      <p>Regards,<br/>AidME</p>
    `,
  });

  res.json({ success: true });
});

export default router;
