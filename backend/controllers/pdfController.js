const PdfModel = require("../models/pdfModel");
const openai = require("./openaiSetup");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");
const { PDFDocument, rgb } = require("pdf-lib");
const fetch = require("node-fetch");

const prompts = [
  "act like an expert mba admissions consultant. evaluate this resume. look at the total number of years of experience and advice the applicant on how mba ready they are. for instance, someone with 0 to 2 years of experience might not have the best chance cracking a top mba program but might be able to get into a b-school in your own country. provide very specific advice based on the user's years of experience.",
  "act like an mba admissions expert. check the education background, career experience, projects, skills and keywords mentioned in the resume. based on what you find, provide a summary of the applicant's journey so far. follow this up with suggestions on what kind of mba programs would work for them. after this, they need to know about the top 3 possible career paths they can get into post-mba along with some details about the same",
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
        {
          role: "system",
          content:
            "Process the following PDF text with the given prompt and consider yourself as a veteran in education field with ore than 10 years of experince and alsoplease dont mention that you are veteran or your experince and give response based on the prompt.",
        },
        { role: "user", content: pdfText },
        { role: "user", content: prompt },
      ];

      // Call the OpenAI API for chat completion
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 150,
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
      // If the PDF does not exist, create a new entry
      pdf = new PdfModel({
        fileName: originalname,
        fileData: buffer,
        fileHash,
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

async function generatePdfFromResponse(req, res) {
  try {
    const { responses } = req.body;

    const pdfDoc = await PDFDocument.create();

    // Load the header image just once
    const headerImageBytes = await fetch(
      "https://lh3.googleusercontent.com/4MwUs0FiiSAX_d8ORJWpmp-xn1ifvguLFtr-x7vu_Km6CvmXUzE_pmbRW90uLOiPwbEneFAeXaJ-8gwtT2nAdVLsSYIsod2MrD8=s0"
    ).then((res) => res.arrayBuffer());
    const headerImage = await pdfDoc.embedPng(headerImageBytes);

    responses.forEach((response, index) => {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Add header image
      page.drawImage(headerImage, {
        x: 10,
        y: height - 60,
        width: 80,
      });

      // Add line
      page.drawLine({
        start: { x: 10, y: height - 70 },
        end: { x: width - 10, y: height - 70 },
        color: rgb(0, 0, 0),
        thickness: 1,
      });

      // Add response text
      page.drawText(response, {
        x: 10,
        y: height - 90, // Adjust the y value to ensure text is below the header and line
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 14,
        maxWidth: width - 20,
      });
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

module.exports = {
  uploadOrRetrievePdf,
  downloadPdf,
  generatePdfFromResponse,
};
