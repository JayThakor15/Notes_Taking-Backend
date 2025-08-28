const User = require("../models/user.model.ts");
const generateOTP = require("../utils/generateotp.ts");

// Login with email, send OTP if user exists
exports.login = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found. Please sign up first." });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    // TODO: Send OTP to email (use nodemailer)
    return res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    return res.status(500).json({ error: "Login failed" });
  }
};

// Signup with email, generate OTP, save user
exports.signup = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user = new User({ email, otp, otpExpires });
    await user.save();
    // TODO: Send OTP to email (use nodemailer)
    return res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
    return res.status(500).json({ error: "Signup failed" });
  }
};

// Verify OTP, create JWT
const jwt = require("jsonwebtoken");
exports.verifyOtp = async (
  req: import("express").Request,
  res: import("express").Response
) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP required" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    // OTP valid, create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    user.otp = undefined;
    user.otpExpires = undefined;
    user.jwt = token;
    await user.save();
    return res
      .status(200)
      .json({
        message: "OTP verified successfully",
        token,
        user: { email: user.email },
      });
  } catch (err) {
    return res.status(500).json({ error: "OTP verification failed" });
  }
};
