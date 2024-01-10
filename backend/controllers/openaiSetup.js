const OpenAI = require("openai");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});

module.exports = openai;
