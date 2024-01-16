const mongoose = require("mongoose");
const { getISTDate } = require("../utils/getISTDate");

const pdfSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileData: { type: Buffer, required: true },
  fileHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  created_at: { type: Date, default: getISTDate },
  updated_at: { type: Date, default: getISTDate },
});

const PdfModel = mongoose.model("Pdf", pdfSchema);

module.exports = PdfModel;
