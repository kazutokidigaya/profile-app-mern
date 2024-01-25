const PdfModel = require("../models/pdfModel");
const openai = require("./openaiSetup");
const pdfParse = require("pdf-parse");
const crypto = require("crypto");
// const { PDFDocument, rgb } = require("pdf-lib");
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");
const { Stream } = require("stream");

const prompts = [
  "Please provide a detailed analysis of the attached resume for an MBA application with a focus on personalized and actionable advice. Address the following points in a friendly mentor tone: 1. Detailed Summary of Background and Experience: [Elaborate on the candidate's education, work history, key skills, and interests. Highlight any unique aspects or achievements. Mention how these experiences can be an asset in an MBA program.] 2. Suitability for an MBA: [Discuss how the candidate's specific experiences and career goals align with pursuing an MBA. Provide insights on how an MBA could bridge gaps in their current skill set or career trajectory.] 3. Field of Specialization Advice: [Based on the candidate's unique background and aspirations, suggest specific MBA specializations. Explain why these specializations are a good fit and how they can help in achieving their career goals.] 4. Program and Geography Recommendations: [Recommend MBA programs and locations based on the candidate's professional experience and personal preferences. Offer reasons for each recommendation and how they align with the candidate's career path.] 5. Key Considerations: [Offer practical advice on financial planning, balancing work and study, and preparing for MBA admissions. Suggest resources or steps they can take to address these areas.] 6. Other Considerations: [Discuss factors such as cultural fit, networking opportunities, and long-term career planning, tailored to the candidate's background and goals.] Please use direct, encouraging language, offering guidance like a mentor who understands the candidate's unique journey and potential. Keep readability as a top priority and break down complex sections into paras and bullet points wherever needed. Keep the advice personal and address the reader using pronouns like 'you' and 'your'. DO NOT ROLEPLAY. DO NOT ADD A SALUTATION.  DO NOT REFER TO YOURSELF AS 'I' OR ANYTHING LIKE THAT. THE SIGNATURE CAN BE Team Crackverbal ",
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
        // gpt-3.5-turbo-0301
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

    const addBorder = (doc) => {
      doc
        .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
        .stroke("#0029e4");
    };

    const headerImageWidth = 150; // Set the width of the image
    const headerImageHeight =
      (headerImage.height * headerImageWidth) / headerImage.width; // Calculate the height to maintain aspect ratio

    // Add the logo in the center of the page
    doc.image(
      headerImage,
      (doc.page.width - headerImageWidth) / 2, // Center the image horizontally
      doc.page.height / 3 - headerImageHeight - 20, // Position the image in the middle of the page vertically
      { width: headerImageWidth }
    );

    // Add the title text below the logo
    doc.fontSize(38).text(`Profile Evaluation of ${name}`, 50, 320, {
      align: "center",
    });

    // Add the subtitle text below the title
    doc
      .fontSize(18)
      .fillColor("grey")
      .text("- A Report by Crackverbal", 50, 440, {
        align: "center",
        lineGap: 15,
      });

    addBorder(doc); // Add border and image to the title page
    doc.addPage(); // Start a new page for the responses

    responses.forEach((response, index) => {
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
        }

        // Draw the paragraph
        doc.text(paragraph, 50, doc.y, {
          width: textWidth,
          align: "justify",
        });
        doc.moveDown(); // Add some space after the paragraph
        addBorderAndImage(doc); // Add border and image for the current page
      });

      // Add a new page after each response, except for the last one
      if (index !== responses.length - 1) {
        doc.addPage();
      }
    });

    // Add a thank you page
    doc.addPage();
    doc.fontSize(28).text("Ready to Turn Insights into Action? ", 50, 220, {
      align: "center",
    });

    // Text block
    const textBlock =
      "Completing your profile evaluation is just the beginning.Connect with a career advisor to understand your analysis and map out your personalized path to a management program. They're ready to help you strategize and answer any questions.";
    const textBlockX = 50;
    const textBlockY = 280;
    const textBlockWidth = doc.page.width - 100;

    // Add text on top of the button rectangle
    doc
      .fontSize(18)
      .fillColor("#818589")
      .text(textBlock, textBlockX, textBlockY, {
        width: textBlockWidth,
        align: "center",
      });

    // Get the height of the text block to position the button below it
    const textHeight = doc.heightOfString(textBlock, {
      width: textBlockWidth,
    });

    // Define button styles
    const buttonWidth = 190;
    const buttonHeight = 35;
    const buttonX = (doc.page.width - buttonWidth) / 2;
    const buttonY = textBlockY + textHeight + 60; // Position the button below the text block

    // Draw button rectangle
    doc
      .rect(buttonX, buttonY, buttonWidth, buttonHeight)
      .fillAndStroke("#0029e4", "#0029e4");

    // Add text on top of the button rectangle
    doc
      .fontSize(18)
      .fillColor("white")
      .text(
        "Schedule my free call",
        buttonX,
        buttonY + buttonHeight / 2 - 9, // Center text vertically in the button
        {
          width: buttonWidth,
          align: "center",
        }
      );

    // Add link over the button
    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, "http://calend.ly/");

    addBorderAndImage(doc); // Add border and image to the thank you page

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
