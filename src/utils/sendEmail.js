const nodemailer = require("nodemailer");

/* =========================================
   TRANSPORTER SETUP — GMAIL
========================================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================================
   SEND EMAIL FUNCTION
========================================= */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const info = await transporter.sendMail({
      from: `"Song App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email error:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
