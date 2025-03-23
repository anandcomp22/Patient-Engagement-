const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const mailOptions = {
  from: process.env.SMTP_EMAIL,
  to: "shreyas.sadavarte_comp22@pccoer.in",
  subject: "Test Email",
  text: "This is a test email.",
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error("Error sending email:", err);
  } else {
    console.log("Email sent successfully!", info.response);
  }
});
