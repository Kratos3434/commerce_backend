import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: "gmail",
    //name: 'PTA',
    auth: {
        user: "keithcarlos34@gmail.com",
        pass: process.env.MAIL_PASS,
    },
});

export const sendOtp = async (to: string, otp: string) => {
    const mailOptions = {
        from: "keithcarlos34@gmail.com",
        to,
        subject: "Verify email",
        html: `
              <p>Dear ${to},</p>
              <div></div>
              <div>
                  <p>Welcome to  <b>The commerce</b> Enter the code below to activate your account</p>
                  <b>${otp}</b>
                  <p>This will expire in 24 hours</p>
                  <p>Thank you,</p>
                  <p>The commerce Team</p>
              </div>
           `,
    };

    await transporter.sendMail(mailOptions);
}

export const sendPasswordResetLink = async (to: string, link: string) => {
    const mailOptions = {
        from: "keithcarlos34@gmail.com",
        to,
        subject: "Verify email",
        html: `
              <p>Dear ${to},</p>
              <div></div>
              <div>
                  <p>Go to the link below to reset your password:</p>
                  <a href="${link}">${link}</a>
                  <p>This will expire in 24 hours</p>
                  <p>Thank you,</p>
                  <p>The commerce Team</p>
              </div>
           `,
    };

    await transporter.sendMail(mailOptions);
}