import express from "express";
import authController from "../controller/auth.controller.js";

const router = express.Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/google", authController.googleAuth);
router.post("/resend-otp", authController.resendOtp);

export default router;
