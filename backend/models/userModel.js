// UserModel.js
const mongoose = require("mongoose");
const { getISTDate } = require("../utils/getISTDate");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  maxAttempts: {
    type: Number,
    default: 99,
  },

  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: getISTDate },
  // Add other user properties and validations as needed
});

module.exports = mongoose.model("User", UserSchema);
