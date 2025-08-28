const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: false,
    },
    otpExpires: {
      type: Date,
      required: false,
    },
    jwt: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
