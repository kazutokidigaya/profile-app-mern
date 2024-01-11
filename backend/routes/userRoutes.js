// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Register User
router.post("/register", userController.registerUser);

// Add other user routes as needed
router.get("/", userController.getAllUsers);

router.post("/send-otp", userController.sendOTP);

// Verify OTP
router.post("/verify-otp", userController.verifyOTP);

module.exports = router;
