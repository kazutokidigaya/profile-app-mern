// pdfRoutes.js
const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage(); // Storing files in memory
const upload = multer({ storage: storage });

const pdfController = require("../controllers/pdfController");

router.post("/upload", upload.single("file"), pdfController.uploadPdf);
router.get("/process/:pdfId", pdfController.processPdf);

module.exports = router;
