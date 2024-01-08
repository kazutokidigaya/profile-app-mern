// PdfModel.js
const mongoose = require("mongoose");

const PdfSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  file_name: {
    type: String,
  },
  file_bytes: {
    type: Buffer, // or String, depending on how you store the actual PDF data
  },
  // Add other properties or modify according to how you want to store PDFs
});

module.exports = mongoose.model("Pdf", PdfSchema);
