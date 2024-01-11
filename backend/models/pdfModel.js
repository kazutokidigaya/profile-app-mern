const mongoose = require("mongoose");
const getISTDate = () => {
  const currentUtcTime = new Date();
  const istOffset = 5.5; // IST is UTC +5:30
  return new Date(currentUtcTime.getTime() + istOffset * 3600 * 1000);
};

const pdfSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileData: { type: Buffer, required: true },
  fileHash: { type: String, required: true, unique: true }, // Add this line
  created_at: { type: Date, default: getISTDate },
});

const PdfModel = mongoose.model("Pdf", pdfSchema);

module.exports = PdfModel;
