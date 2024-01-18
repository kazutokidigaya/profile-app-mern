const PdfModel = require("../models/pdfModel");
const openai = require("./openaiSetup");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");
// const { PDFDocument, rgb } = require("pdf-lib");
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");
const { Stream } = require("stream");

const prompts = [
  "act like an expert mba admissions consultant. evaluate this resume. look at the total number of years of experience and advice the applicant on how mba ready they are. for instance, someone with 0 to 2 years of experience might not have the best chance cracking a top mba program but might be able to get into a b-school in your own country. provide very specific advice based on the user's years of experience.",
  "act check the education background, career experience, projects, skills and keywords mentioned in the resume. based on what you find, provide a summary of the applicant's journey so far. follow this up with suggestions on what kind of mba programs would work for them. after this, they need to know about the top 3 possible career paths they can get into post-mba along with some details about the same .",
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
        // max_tokens: 250,
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
    let pdfText;
    try {
      // Attempt to convert PDF to text
      pdfText = await convertPdfToText(pdf.fileData);
    } catch (error) {
      // Handle the error specifically from pdfParse
      console.error("Error converting PDF to text:", error);
      return res.status(400).json({
        message:
          "The uploaded PDF could not be converted to text. It may be empty or corrupted.",
      });
    }

    if (!pdfText.trim()) {
      // Check for empty or non-meaningful content
      return res.status(400).json({
        message:
          "The uploaded PDF is empty or the content is not meaningful for analysis.",
      });
    }

    const openaiResponses = await processPdfWithOpenAI(pdfText);
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
      // Ensure border and image for the first page of each response
      addBorderAndImage(doc);

      // Draw the text
      const textWidth = doc.page.width - 2 * 50;
      doc.fontSize(17).fillColor("black");
      const paragraphs = response.split(/\r\n|\r|\n/); // Split the response into paragraphs
      paragraphs.forEach((paragraph) => {
        const paragraphHeight = doc.heightOfString(paragraph, {
          width: textWidth,
          align: "justify",
        });

        if (doc.y + paragraphHeight > doc.page.height - 50) {
          // Check if adding the paragraph will exceed the page height
          doc.addPage(); // Add a new page
          addBorderAndImage(doc); // Add border and image for the new page
        }

        // Draw the paragraph
        doc.text(paragraph, 50, doc.y, {
          width: textWidth,
          align: "justify",
        });
        doc.moveDown(); // Add some space after the paragraph
      });

      // Add a new page after each response, except for the last one
      if (index !== responses.length - 1) {
        doc.addPage();
        addBorderAndImage(doc); // Ensure border and image on the new page
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

module.exports = {
  uploadOrRetrievePdf,
  downloadPdf,
  generatePdfFromResponse,
};
