import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Create transporter object
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (to: string, otp: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Your OTP for NotesHive",
      html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">NotesHive Authentication</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) for NotesHive is:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                        <h1 style="color: #1f2937; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                        Best regards,<br>
                        The NotesHive Team
                    </p>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
