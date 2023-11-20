import nodemailer from "nodemailer"

 const sendEmail = async function(email,subject,message){

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT|| 465,
  secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.SMTP_USER,
    pass:process.env.SMTP_PASS 
  }
});

// async..await is not allowed in global scope, must use a wrapper

  // send mail with defined transport object
 await transporter.sendMail({
    from:"bishal@gmail.com" , // sender address
    to:email , // list of receivers
    subject:subject, //"Hello ✔", // Subject line
    email:email,// "Hello world?", // plain text body
    message: message, //"<b>Hello world?</b>", // html body
  });

//   console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //



} 
export default sendEmail;