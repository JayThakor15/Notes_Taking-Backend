import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false, // Made optional - will be set after OTP verification
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: false, // Made optional - will be set after OTP verification
    },
    // Temporary fields to store data during signup process
    tempName: {
      type: String,
      required: false,
      trim: true,
    },
    tempDob: {
      type: Date,
      required: false,
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
export default User;
