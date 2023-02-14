const nodemailer = require('nodemailer');


module.exports = sendEmail;

async function sendEmail({emailFrom, emailTo , emailSubject, emailText}) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: emailFrom,
        to: emailTo,
        subject: emailSubject,
        text: emailText
    });
}