const PdfModel = require("../models/pdfModel");
const openai = require("./openaiSetup");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");
const { PDFDocument, rgb } = require("pdf-lib");
const fetch = require("node-fetch");

const prompts = [
  "act like an expert mba admissions consultant. evaluate this resume. look at the total number of years of experience and advice the applicant on how mba ready they are. for instance, someone with 0 to 2 years of experience might not have the best chance cracking a top mba program but might be able to get into a b-school in your own country. provide very specific advice based on the user's years of experience.  can you give a response not as a third party but be a human and gives response in not more than 250 words please and don't mention this text",
  "act like an mba admissions expert. check the education background, career experience, projects, skills and keywords mentioned in the resume. based on what you find, provide a summary of the applicant's journey so far. follow this up with suggestions on what kind of mba programs would work for them. after this, they need to know about the top 3 possible career paths they can get into post-mba along with some details about the same.can you give a response not as a third party but be a human and gives response in not more than 250 words please and don't mention this text",
];

// Function to calculate hash of the file for uniqueness
const calculateFileHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

// Convert PDF to text
async function convertPdfToText(fileData) {
  try {
    const data = await pdfParse(fileData);
    return data.text;
  } catch (error) {
    console.error("Error converting PDF to text:", error);
    throw new Error("Failed to convert PDF to text");
  }
}
// Process PDF with OpenAI using Chat Completion

async function processPdfWithOpenAI(pdfText) {
  let responses = [];

  for (let prompt of prompts) {
    try {
      // Each prompt is treated as a separate user message in a chat
      const messages = [
        { role: "system", content: prompt },
        { role: "user", content: pdfText },
      ];

      // Call the OpenAI API for chat completion
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 300,
      });

      // Collect the AI's response from the chat
      const aiResponse = chatCompletion.choices[0].message.content;
      responses.push(aiResponse);
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      throw new Error("Failed to get response from OpenAI");
    }
  }

  return responses;
}

// Upload or retrieve PDF
async function uploadOrRetrievePdf(req, res) {
  try {
    const { originalname, buffer } = req.file;
    const fileHash = calculateFileHash(buffer);

    // Check if a PDF with the same hash already exists
    let pdf = await PdfModel.findOne({ fileHash });

    if (!pdf) {
      pdf = new PdfModel({
        fileName: originalname,
        fileData: buffer,
        fileHash,
        userId: null, // Set userId to null initially
      });
      await pdf.save();
    }
    // Convert PDF to text
    const pdfText = await convertPdfToText(pdf.fileData);

    // Process PDF text with OpenAI
    const openaiResponses = await processPdfWithOpenAI(pdfText);

    // Respond with OpenAI processed data
    res
      .status(200)
      .json({ message: "PDF processed", pdfId: pdf._id, openaiResponses });
  } catch (error) {
    console.error("Error in PDF upload:", error);
    res.status(500).json({ message: "Error uploading PDF" });
  }
}

async function downloadPdf(req, res) {
  try {
    const { pdfId } = req.params;
    const pdf = await PdfModel.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${pdf.fileName}`
    );
    res.send(pdf.fileData);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    res.status(500).json({ message: "Error downloading PDF" });
  }
}

// pdf uploadrer
async function generatePdfFromResponse(req, res) {
  try {
    const { responses, name } = req.body;
    if (!Array.isArray(responses) || typeof name !== "string") {
      throw new Error(
        "Invalid input: responses should be an array and name should be a string."
      );
    }
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
    const titleVerticalPosition = titleHeight - 250; // Move title upwards

    titlePage.drawText(`Profile Analysis Report For ${name}`, {
      x: titleMargin,
      y: titleVerticalPosition,
      lineHeight: 80,
      size: 66,
      color: rgb(0, 0, 0),
      maxWidth: titleWidth - 2 * titleMargin,
      align: "left",
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

    res.writeHead(200, {
      "Content-Length": pdfBytes.length,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="openai_response.pdf"',
    });
    res.end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
}

module.exports = {
  uploadOrRetrievePdf,
  downloadPdf,
  generatePdfFromResponse,
};
