const OpenAI = require("openai");
require("dotenv").config();

const apiKey = process.env.OPENAI_API_KEY; // Make sure this is set in your environment variables
const openai = new OpenAI(apiKey);

module.exports = openai;
