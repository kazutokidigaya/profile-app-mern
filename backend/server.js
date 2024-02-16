const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Define a simple route for get request on '/'
app.get("/", (req, res) => res.send("API is running..."));

// Initialize HTTP server with Express app
const server = http.createServer(app);

// Initialize WebSocket Server on the HTTP server
const wss = new WebSocket.Server({ server });

// Middleware to attach WebSocket Server to request
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

// Import routes
const userRoutes = require("./routes/userRoutes"); // Adjust with actual path
const pdfRoutes = require("./routes/pdfRoutes"); // Ensure this is after `req.wss` middleware

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/pdfs", pdfRoutes);

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("connecting is set up");
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    console.log(data);
    if (data.type === "processId") {
      console.log("Received processId:", data.processId);
      // You can store or use this processId as needed
    }
  });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).send("404 Not Found");
});

// Error Handler
app.use((err, req, res, next) => {
  res.status(500).send(`Error: ${err.message}`);
});

// Listen on HTTP server, not Express app
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
