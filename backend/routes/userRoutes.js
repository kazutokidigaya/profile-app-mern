// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Register User
router.post("/register", userController.registerUser);

// Add other user routes as needed
router.get("/", userController.getAllUsers);

module.exports = router;
