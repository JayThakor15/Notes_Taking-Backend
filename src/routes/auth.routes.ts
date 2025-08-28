const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.controller.ts");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
