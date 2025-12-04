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
      <h2 style="font-family: Arial, sans-serif; color: #333;">
      Dear ${name},
      </h2>

      <p style="font-family: Arial, sans-serif; color: #444; line-height: 1.6;">
        We are pleased to inform you that your registration payment has been successfully received.
      </p>

      <p style="font-family: Arial, sans-serif; color: #444; line-height: 1.6;">
        <strong>Transaction ID:</strong> ${tranId}
      </p>

      <p style="font-family: Arial, sans-serif; color: #444; line-height: 1.6;">
        We look forward to welcoming you to the reunion and sharing an unforgettable event together.
      </p>

      <p style="font-family: Arial, sans-serif; color: #444; line-height: 1.6; margin-bottom: 10px;">
        Please present the following QR code at the entrance:
      </p>

      <img src="cid:qrImage" style="width:200px; height:auto; margin: 10px 0;" />

      <p style="font-family: Arial, sans-serif; color: #444; line-height: 1.6; margin-top: 20px;">
        Warm regards,<br/>
        <strong>CPSCM Reunion Team</strong>
      </p>

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
