// Google OAuth login/signup
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not defined in environment variables.");
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const googleAuth = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { idToken, userData } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "ID token required" });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID as string,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      return res
        .status(400)
        .json({ error: "Email not found in Google account" });
    }
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with Google data
      user = new User({
        email,
        name: userData?.name || payload?.name,
        picture: userData?.picture || payload?.picture,
        // We can save other Google profile data here
      });
    } else {
      // Update existing user's data if needed
      if (!user.name && (userData?.name || payload?.name)) {
        user.name = userData?.name || payload?.name;
      }
      if (userData?.picture || payload?.picture) {
        user.picture = userData?.picture || payload?.picture;
      }
    }
    await user.save();
    // Create JWT
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    user.jwt = token;
    await user.save();
    return res
      .status(200)
      .json({ token, user: { email: user.email, name: user.name } });
  } catch (err) {
    return res.status(401).json({ error: "Google authentication failed" });
  }
};
import User from "../models/user.model.js";
import generateOTP from "../utils/generateotp.js";
import { sendOTPEmail } from "../utils/sendEmail.js";

// Login with email, send JWT token if user exists
const login = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  let { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  // Convert email to lowercase to ensure case-insensitive matching
  email = email.toLowerCase();
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Please sign up first." });
    }

    // Generate and save OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.status(200).json({
      message: "OTP sent to your email",
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
};

// Signup with email, generate OTP, save temporary user data
const signup = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { name, email, dob } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!name || !dob) {
    return res
      .status(400)
      .json({ error: "Name and date of birth are required" });
  }
  try {
    let user = await User.findOne({ email });
    if (user && user.jwt) {
      // User already exists and is verified
      return res.status(400).json({ error: "Email already registered" });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }
    if (user) {
      // Update existing temporary user
      user.otp = otp;
      user.otpExpires = otpExpires;
      // Store name and dob temporarily for verification
      user.tempName = name;
      user.tempDob = dob;
    } else {
      // Create new temporary user (only email, OTP, and temp data)
      user = new User({
        email,
        otp,
        otpExpires,
        tempName: name,
        tempDob: dob,
      });
    }
    await user.save();
    // TODO: Send OTP to email (use nodemailer)
    return res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
    return res.status(500).json({ error: "Signup failed" });
  }
};

// Verify OTP, create JWT, and save user data permanently
const verifyOtp = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }
  try {
    const user = await User.findOne({ email });
    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Create JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // If this is a signup flow (has temporary data), move it to permanent fields
    if (user.tempName && user.tempDob) {
      user.name = user.tempName;
      user.dob = user.tempDob;
      user.tempName = null;
      user.tempDob = null;
    }

    // Clean up OTP fields and save token
    user.otp = null;
    user.otpExpires = null;
    user.jwt = token;

    await user.save();
    return res.status(200).json({
      message: user.tempName
        ? "Account created successfully"
        : "Login successful",
      token,
      user: { email: user.email, name: user.name, dob: user.dob },
    });
  } catch (err) {
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

// Resend OTP
const resendOtp = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    return res.status(200).json({
      message: "New OTP sent to your email",
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to resend OTP" });
  }
};

export default {
  googleAuth,
  login,
  signup,
  verifyOtp,
  resendOtp,
};
