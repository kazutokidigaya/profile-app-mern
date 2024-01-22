// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// In your routes file
const authenticate = require("../middleware/auth");

// Register User
router.post("/register", userController.registerUser);

// to get all users
router.get("/details", authenticate, userController.getUserDataForAdmin);

// Add other user routes as needed
// router.get("/", userController.getAllUsers);

router.post("/send-otp", userController.sendOTP);

// Verify OTP
router.post("/verify-otp", userController.verifyOTP);

module.exports = router;
