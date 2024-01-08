// userController.js

const User = require("../models/userModel"); // Path to your User model

// Register a new user or update an existing user
exports.registerUser = async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update user's information if they already exist
      user = await User.findOneAndUpdate(
        { email },
        { name, mobile },
        { new: true }
      );
      return res.status(200).json(user);
    }

    // If new user, create user
    user = new User({ name, email, mobile });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const allUser = await User.find({});
    res.status(200).json(allUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
