// userController.js
const User = require("../models/userModel"); // Path to your User model
const {
  createOrUpdateLead,
  updateActivity,
} = require("../utils/leadsquaredUtil");

const twilio = require("twilio");

require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Replace with your Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Replace with your Auth Token
const verifySid = process.env.TWILIO_SERVICE_SID; // Replace with your Verify Service SID
const twilioClient = twilio(accountSid, authToken);
const PdfModel = require("../models/pdfModel");
// Other functions...

const { getISTDate } = require("../utils/getISTDate");

exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;
  const formattedMobile = `+${mobile}`; // Adjust according to your needs

  try {
    const verification = await twilioClient.verify
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
    const verificationCheck = await twilioClient.verify
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

exports.registerUser = async (req, res) => {
  const { name, email, mobile, pdfId, source } = req.body;

  try {
    // Check if the email is already used by a different mobile number
    const existingEmailUser = await User.findOne({
      email,
      mobile: { $ne: mobile },
    });
    if (existingEmailUser) {
      return res.status(400).json({
        message: "Email is already in use with a different mobile number.",
      });
    }

    let user = await User.findOne({ mobile });

    // Check if user has used all attempts
    if (user && user.maxAttempts <= 0) {
      return res
        .status(400)
        .json({ message: "You have used your max allocated usage." });
    }

    if (!user) {
      // New user registration
      user = new User({
        name,
        email,
        mobile,
        created_at: getISTDate(),
        updated_at: getISTDate(),
      });
      await user.save();
    } else {
      // Existing user - update name, email, and decrement attempts
      user = await User.findOneAndUpdate(
        { mobile },
        { name, email, $inc: { maxAttempts: -1 }, updated_at: getISTDate() },
        { new: true }
      );
    }

    // Create or update lead in LeadSquared CRM
    const leadResponse = await createOrUpdateLead({ name, email, mobile });
    const leadId = leadResponse.Message.RelatedId;

    // Update activity in LeadSquared CRM if a PDF is provided
    if (pdfId) {
      const pdf = await PdfModel.findById(pdfId);
      if (pdf) {
        await updateActivity(leadId, pdf.fileName, source);
      }
      // Update PDF with userId
      await PdfModel.findByIdAndUpdate(pdfId, {
        userId: user._id,
        updated_at: getISTDate(),
      });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
};
// Register a new user or update an existing user
exports.registerUser = async (req, res) => {
  const { name, email, mobile, pdfId, source, medium, campaign } = req.body;

  try {
    // Try to find the user by email or mobile
    let user = await User.findOne({ $or: [{ email }, { mobile }] });

    if (user) {
      // Check if user has used all attempts
      if (user.maxAttempts <= 0) {
        return res
          .status(200)
          .json({ message: "You have used your max allocated usage." });
      }

      // Update existing user's information and decrement attempts
      user = await User.findOneAndUpdate(
        { $or: [{ email }, { mobile }] },
        { name, email, $inc: { maxAttempts: -1 }, updated_at: getISTDate() },
        { new: true }
      );
    } else {
      // New user registration
      user = new User({
        name,
        email,
        mobile,
        created_at: getISTDate(),
        updated_at: getISTDate(),
      });
      await user.save();
    }

    // Create or update lead in LeadSquared CRM
    const leadResponse = await createOrUpdateLead({
      name,
      email,
      mobile,
      source,
      medium,
      campaign,
    });
    const leadId = leadResponse.Message.RelatedId;

    // Update PDF with userId if pdfId is provided
    if (pdfId) {
      const pdf = await PdfModel.findById(pdfId);
      if (pdf) {
        await updateActivity(leadId, pdf.fileName);
      }

      // Update PDF with userId
      await PdfModel.findByIdAndUpdate(pdfId, {
        userId: user._id,
        updated_at: getISTDate(),
      });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error in registerUser:", error);
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

exports.getUserDataForAdmin = async (req, res) => {
  try {
    // Fetch registered user details and their associated PDFs
    const userDetails = await User.aggregate([
      {
        $lookup: {
          from: "pdfs",
          localField: "_id",
          foreignField: "userId",
          as: "pdfDetails",
        },
      },
    ]);

    // Fetch PDFs with userId as null
    const unregisteredPdfs = await PdfModel.find({ userId: null });

    // Transform unregistered PDFs to match the structure of user details
    const unregisteredPdfDetails = unregisteredPdfs.map((pdf) => ({
      _id: pdf._id,
      name: "Unregistered",
      email: "N/A",
      mobile: "N/A",
      pdfDetails: [pdf],
      created_at: pdf.created_at,
      updated_at: pdf.updated_at,
    }));

    // Combine both registered and unregistered PDFs
    const combinedDetails = [...userDetails, ...unregisteredPdfDetails];

    res.json(combinedDetails);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
};
