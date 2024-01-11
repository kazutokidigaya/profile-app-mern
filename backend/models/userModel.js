// UserModel.js
const mongoose = require("mongoose");

const getISTDate = () => {
  const currentUtcTime = new Date();
  const istOffset = 5.5; // IST is UTC +5:30
  return new Date(currentUtcTime.getTime() + istOffset * 3600 * 1000);
};

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

  created_at: { type: Date, default: getISTDate },
  // Add other user properties and validations as needed
});

module.exports = mongoose.model("User", UserSchema);
