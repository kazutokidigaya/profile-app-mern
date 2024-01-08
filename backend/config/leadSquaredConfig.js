const axios = require("axios");

const leadSquaredApi = axios.create({
  baseURL: process.env.LEADSQUARED_HOST,
  headers: {
    "Content-Type": "application/json",
    accessKey: process.env.LEADSQUARED_ACCESSKEY,
    secretKey: process.env.LEADSQUARED_SECRETKEY,
  },
});

module.exports = leadSquaredApi;
