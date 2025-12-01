const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

async function sendConfirmationEmail(toEmail, name, tranId, qrImageURL) {
  return transporter.sendMail({
    from: `CPSCM Reunion <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Registration Confirmed – CPSCM Reunion 🎉",
    html: `
      <h2>Dear ${name},</h2>
      <p>Your registration payment was successful.</p>
      <p><strong>Transaction ID:</strong> ${tranId}</p>
      <p>We are excited to see you at the reunion!</p>
      <p>Show this QR at the entrance:</p>
      <img src="cid:qrImage" style="width:200px; height:auto;" />
      <br/>
      <p>Warm regards,</p>
      <p>CPSCM Reunion Team</p>
    `,
    attachments: [
      {
        filename: "qr.png",
        content: qrImageURL.split("base64,")[1],
        encoding: "base64",
        cid: "qrImage", // same as in HTML <img src="cid:qrImage">
      }
    ]
  });
}

module.exports = { sendConfirmationEmail };
