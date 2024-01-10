const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileData: { type: Buffer, required: true },
  created_at: { type: Date, default: Date.now },
});

const PdfModel = mongoose.model("Pdf", pdfSchema);

module.exports = PdfModel;
