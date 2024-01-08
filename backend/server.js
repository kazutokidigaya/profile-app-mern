const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Import routes
const userRoutes = require("./routes/userRoutes"); // Adjust with actual path
const pdfRoutes = require("./routes/pdfRoutes"); // Adjust with actual path

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

// Initialize express app
const app = express();

// Use middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Define routes
app.use("/api/users", userRoutes);
app.use("/api/pdfs", pdfRoutes);

// Define a simple route for get request on '/'
app.get("/", (req, res) => res.send("API is running..."));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).send("404 Not Found");
});

// Error Handler
app.use((err, req, res, next) => {
  res.status(500).send(`Error: ${err.message}`);
});

// Listen to server
const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
