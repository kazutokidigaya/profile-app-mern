// pdfController.js
const PdfModel = require("../models/pdfModel");
const openai = require("./openaiSetup"); // Assuming you have an OpenAI setup file
const pdfParse = require("pdf-parse");

const prompts = [
  "act like an expert mba admissions consultant. evaluate this resume. look at the total number of years of experience and advice the applicant on how mba ready they are. for instance, someone with 0 to 2 years of experience might not have the best chance cracking a top mba program but might be able to get into a b-school in your own country. provide very specific advice based on the user's years of experience.",
  "act like an mba admissions expert. check the education background, career experience, projects, skills and keywords mentioned in the resume. based on what you find, provide a summary of the applicant's journey so far. follow this up with suggestions on what kind of mba programs would work for them. after this, they need to know about the top 3 possible career paths they can get into post-mba along with some details about the same",
];

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

// Process PDF with OpenAI for each prompt
async function processPdfWithOpenAI(pdfText) {
  let responses = [];

  for (let prompt of prompts) {
    try {
      const openaiResponse = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: pdfText + "\n\n" + prompt, // Combining PDF text with each prompt
        temperature: 0.7,
        max_tokens: 150,
      });
      responses.push(openaiResponse.data.choices[0].text);
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      throw new Error("Failed to get response from OpenAI");
    }
  }

  return responses;
}

// Upload PDF
async function uploadPdf(req, res) {
  if (req.file) {
    console.log(req.file);
  }
  try {
    const { originalname, buffer } = req.file;
    console.log(req.file);
    const newPdf = new PdfModel({
      fileName: originalname,
      fileData: buffer,
    });

    await newPdf.save();

    res
      .status(201)
      .json({ message: "PDF uploaded successfully", pdfId: newPdf._id });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ message: "Error uploading PDF" });
  }
}

// Process PDF
async function processPdf(req, res) {
  try {
    const { pdfId } = req.params;
    const pdf = await PdfModel.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    const pdfText = await convertPdfToText(pdf.fileData);

    // Process PDF with OpenAI and get responses for each prompt
    const openaiResponses = await processPdfWithOpenAI(pdfText);

    res.status(200).json({ openaiResponses });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ message: "Error processing PDF" });
  }
}

module.exports = { uploadPdf, processPdf };
