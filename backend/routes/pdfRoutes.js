const express = require("express");
const multer = require("multer");
const pdfController = require("../controllers/pdfController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  upload.single("file"),
  pdfController.uploadOrRetrievePdf
);

router.get("/download/:pdfId", pdfController.downloadPdf);
router.post("/generate-pdf", pdfController.generatePdfFromResponse);

module.exports = router;
