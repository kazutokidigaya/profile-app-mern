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
  const { name, email, mobile, pdfId, source } = req.body;

  try {
    let user = await User.findOne({ mobile });
    let isNewUser = false;

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
        maxAttempts: 3, // Initial value for max attempts
      });
      await user.save();
      isNewUser = true;
    } else {
      // Existing user - decrement attempts
      await User.findOneAndUpdate(
        { mobile },
        { name, email, $inc: { maxAttempts: -1 }, updated_at: getISTDate() },
        { new: true }
      );
    }

    // Create or update lead in LeadSquared CRM
    const leadResponse = await createOrUpdateLead({ name, email, mobile });
    const leadId = leadResponse.Message.Id;

    // Update activity in LeadSquared CRM
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
exports.getAllUsers = async (req, res) => {
  try {
    const allUser = await User.find({});
    res.status(200).json(allUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// pdf uploadrer
async function generatePdfFromResponse(req, res) {
  try {
    const { responses } = req.body;
    const pdfDoc = await PDFDocument.create();

    // Load the header image
    const headerImageBytes = await fetch(
      "https://lh3.googleusercontent.com/4MwUs0FiiSAX_d8ORJWpmp-xn1ifvguLFtr-x7vu_Km6CvmXUzE_pmbRW90uLOiPwbEneFAeXaJ-8gwtT2nAdVLsSYIsod2MrD8=s0"
    ).then((res) => res.arrayBuffer());
    const headerImage = await pdfDoc.embedPng(headerImageBytes);

    // Add a title page
    const titlePage = pdfDoc.addPage();
    const titleMargin = 55;
    const { width: titleWidth, height: titleHeight } = titlePage.getSize();
    titlePage.drawRectangle({
      x: 0,
      y: 0,
      width: titleWidth,
      height: titleHeight,
      borderColor: rgb(0, 0.16, 0.89),
      borderWidth: 10,
    });
    titlePage.drawText("Profile Analysis Report", {
      x: titleMargin, // Set margin from the left side
      y: titleHeight / 2, // Centered vertically
      lineHeight: 80,
      size: 66,
      color: rgb(0, 0, 0),
      maxWidth: titleWidth - 2 * titleMargin, // Adjust maxWidth accordingly
      align: "left", // Align text to the left
    });

    // Draw the text and image for each response
    responses.forEach((response, index) => {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Draw border
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        borderColor: rgb(0, 0.16, 0.89),
        borderWidth: 10,
      });

      // Draw the text
      page.drawText(response, {
        x: 25,
        y: height - 100,
        size: 14,
        lineHeight: 30,
        color: rgb(0, 0, 0),
        maxWidth: width - 50,
      });

      // Add header image at the bottom right
      const imageHeight = 60;

      const imageWidth = (headerImage.width * imageHeight) / headerImage.height;
      page.drawImage(headerImage, {
        x: width - imageWidth - 20,
        y: 20,
        width: imageWidth,
        height: imageHeight,
      });
    });

    // Add a thank you page
    const thankYouPage = pdfDoc.addPage();
    const thankYouMargin = 120; // Margin from the left side
    const { width: thankYouWidth, height: thankYouHeight } =
      thankYouPage.getSize();
    thankYouPage.drawRectangle({
      x: 0,
      y: 0,
      width: thankYouWidth,
      height: thankYouHeight,
      borderColor: rgb(0, 0.16, 0.89),
      borderWidth: 10,
    });
    thankYouPage.drawText("Thank You!", {
      x: thankYouMargin, // Set margin from the left side
      y: thankYouHeight / 2 - 33, // Adjusting for the font size, centered vertically
      size: 66,
      color: rgb(0, 0, 0),
      maxWidth: thankYouWidth - 2 * thankYouMargin, // Adjust maxWidth accordingly
      align: "left", // Align text to the left
    });

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    res
      .writeHead(200, {
        "Content-Length": pdfBytes.length,
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=openai_response.pdf",
      })
      .end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
}

// v2 with name
async function generatePdfFromResponse(req, res) {
  try {
    const { responses, name } = req.body; // Capture the name from the request body
    console.log(req.body);
    const pdfDoc = await PDFDocument.create();

    // Load the header image
    const headerImageBytes = await fetch(
      "https://lh3.googleusercontent.com/4MwUs0FiiSAX_d8ORJWpmp-xn1ifvguLFtr-x7vu_Km6CvmXUzE_pmbRW90uLOiPwbEneFAeXaJ-8gwtT2nAdVLsSYIsod2MrD8=s0"
    ).then((res) => res.arrayBuffer());
    const headerImage = await pdfDoc.embedPng(headerImageBytes);

    // Define common styles
    const borderColor = rgb(0, 0.16, 0.89);
    const borderWidth = 1;
    const margin = 100;
    const headerImageHeight = 60;
    const headerImageWidth =
      (headerImage.width * headerImageHeight) / headerImage.height;

    // Function to add text to a page with automatic pagination
    const addTextToPage = (pdfDoc, text) => {
      let page = pdfDoc.addPage();
      let y = page.getHeight() - margin;
      let x = margin;

      const lines = text.split("\n");
      for (const line of lines) {
        if (y < margin + headerImageHeight + 20) {
          // Check space for image and bottom margin
          page = pdfDoc.addPage();
          y = page.getHeight() - margin;
          // Draw border for new page
          page.drawRectangle({
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight(),
            borderColor,
            borderWidth,
          });
        }
        page.drawText(line, {
          x,
          y,
          size: 14,
          lineHeight: 20,
          color: rgb(0, 0, 0),
          maxWidth: page.getWidth() - 2 * margin,
        });
        y -= 20; // Decrement y for the next line
      }

      return page; // Return the last page with text
    };

    // Add a title page with the person's name
    let titlePage = pdfDoc.addPage();
    titlePage.drawRectangle({
      x: 0,
      y: 0,
      width: titlePage.getWidth(),
      height: titlePage.getHeight(),
      borderColor,
      borderWidth,
    });
    titlePage.drawText(`Profile Analysis Report for "${name}"`, {
      x: margin,
      y: titlePage.getHeight() - 2 * margin,
      size: 24,
      color: rgb(0, 0, 0),
      maxWidth: titlePage.getWidth() - 2 * margin,
      align: "left",
    });

    // Process each response and add content to the pages
    let lastPage;
    responses.forEach((response) => {
      lastPage = addTextToPage(pdfDoc, response);
    });

    // Add the header image to the bottom right of the last page with content
    lastPage.drawImage(headerImage, {
      x: lastPage.getWidth() - headerImageWidth - margin,
      y: margin,
      width: headerImageWidth,
      height: headerImageHeight,
    });

    // Add a thank you page
    let thankYouPage = pdfDoc.addPage();
    thankYouPage.drawRectangle({
      x: 0,
      y: 0,
      width: thankYouPage.getWidth(),
      height: thankYouPage.getHeight(),
      borderColor,
      borderWidth,
    });
    thankYouPage.drawText("Thank You!", {
      x: margin,
      y: thankYouPage.getHeight() - 2 * margin,
      size: 24,
      color: rgb(0, 0, 0),
      maxWidth: thankYouPage.getWidth() - 2 * margin,
      align: "left",
    });
    thankYouPage.drawImage(headerImage, {
      x: thankYouPage.getWidth() - headerImageWidth - margin,
      y: margin,
      width: headerImageWidth,
      height: headerImageHeight,
    });

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    res
      .writeHead(200, {
        "Content-Length": pdfBytes.length,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="openai_response.pdf"',
      })
      .end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
}

async function generatePdfFromResponse(req, res) {
  try {
    const { responses, name } = req.body;

    if (!Array.isArray(responses) || typeof name !== "string") {
      throw new Error(
        "Invalid input: responses should be an array and name should be a string."
      );
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="openai_response_${Date.now()}.pdf"`,
    });

    // Fetch and Embed the image
    const headerImageUrl =
      "https://lh3.googleusercontent.com/4MwUs0FiiSAX_d8ORJWpmp-xn1ifvguLFtr-x7vu_Km6CvmXUzE_pmbRW90uLOiPwbEneFAeXaJ-8gwtT2nAdVLsSYIsod2MrD8=s0";
    const headerImageBuffer = await fetch(headerImageUrl).then((res) =>
      res.buffer()
    );
    const headerImage = doc.openImage(headerImageBuffer);

    // Function to add border and image to any page
    const addBorderAndImage = (doc) => {
      doc
        .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
        .stroke("#0029e4");
      doc.image(
        headerImage,
        doc.page.width - headerImage.width / 2 - 20,
        doc.page.height - headerImage.height / 2 - 20,
        { width: headerImage.width / 2 }
      );
    };

    // Add a title page with "Profile Analysis Report for [name]"
    doc.fontSize(38).text(`Profile Analysis Report For ${name}`, 50, 220, {
      align: "center",
    });
    addBorderAndImage(doc); // Add border and image to the title page
    doc.addPage(); // Start a new page for the responses

    responses.forEach((response, index) => {
      // Ensure border and image for each new response page
      addBorderAndImage(doc);

      // Draw the text
      const textWidth = doc.page.width - 2 * 50;
      doc
        .fontSize(17)
        .fillColor("black")
        .text(response, 50, 50, {
          align: "justify",
          width: textWidth,
          continued: index !== responses.length - 1,
        });

      if (index !== responses.length - 1) {
        doc.addPage(); // Start a new page for the next response
      }
    });

    // Add a thank you page
    doc.addPage();
    addBorderAndImage(doc); // Add border and image to the thank you page
    doc.fontSize(38).text("Thank You!", 50, 220, {
      align: "center",
    });

    // Finalize the PDF and end the stream
    doc.pipe(stream);
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (!res.headersSent) {
      res.status(500).send("Error generating PDF");
    }
  }
}
