// userController.js
const User = require("../models/userModel"); // Path to your User model
const twilio = require("twilio");

require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Replace with your Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Replace with your Auth Token
const verifySid = process.env.TWILIO_SERVICE_SID; // Replace with your Verify Service SID
const twilioClient = twilio(accountSid, authToken);

// Other functions...

exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;
  const formattedMobile = `+${mobile}`; // Adjust according to your needs
  console.log(formattedMobile);
  try {
    const verification = await twilioClient.verify.v2
      .services(verifySid)
      .verifications.create({ to: formattedMobile, channel: "sms" });
    res
      .status(200)
      .json({ message: "OTP sent", verification: verification.status });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

exports.verifyOTP = async (req, res) => {
  const { mobile, code } = req.body;
  const formattedMobile = `+${mobile}`; // Adjust according to your needs

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: formattedMobile, code });
    res.status(200).json({
      message: "OTP verified",
      verification: verificationCheck.status,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ message: "Error verifying OTP", error });
  }
};

// Register a new user or update an existing user
exports.registerUser = async (req, res) => {
  const { name, email, mobile } = req.body; // Include pdfId in the request body

  try {
    let user = await User.findOne({ email });
    if (user) {
      // Update user with new info and pdfId
      user = await User.findOneAndUpdate(
        { email },
        { name, mobile }, // Include pdfId here
        { new: true }
      );
      return res.status(200).json(user);
    }

    // If new user, create user with pdfId
    user = new User({ name, email, mobile });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
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
