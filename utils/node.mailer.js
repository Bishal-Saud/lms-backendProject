import nodemailer from "nodemailer";

const sendEmail = async function (email, subject, message) {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // async..await is not allowed in global scope, must use a wrapper

  // send mail with defined transport object
  await transporter.sendMail({
    from: process.env.SMTP_FROM_MAIL, // sender address
    to: email, // list of receivers
    subject: subject,
    email: email,
    message: message,
  });
};
export default sendEmail;
