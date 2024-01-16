const axios = require("axios");

require("dotenv").config();
const leadsquaredHost = process.env.LEADSQUARED_HOST;
const leadsquaredAccessKey = process.env.LEADSQUARED_ACCESSKEY;
const leadsquaredSecretKey = process.env.LEADSQUARED_SECRETKEY;

const createOrUpdateLead = async (userData) => {
  const url = `${leadsquaredHost}/LeadManagement.svc/Lead.Capture?accessKey=${leadsquaredAccessKey}&secretKey=${leadsquaredSecretKey}`;
  const headers = { "Content-Type": "application/json" };
  const payload = [
    { Attribute: "FirstName", Value: userData.name },
    { Attribute: "EmailAddress", Value: userData.email },
    { Attribute: "Mobile", Value: userData.mobile },
    { Attribute: "Source", Value: userData.source },
    { Attribute: "SourceCampaign", Value: userData.campaign },
    { Attribute: "SourceMedium", Value: userData.medium },
    // Add other attributes as required
  ];

  try {
    const response = await axios.post(url, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Error in createOrUpdateLead:", error);
    throw error;
  }
};

const updateActivity = async (leadId, pdfName) => {
  const url = `${leadsquaredHost}/ProspectActivity.svc/Create?accessKey=${leadsquaredAccessKey}&secretKey=${leadsquaredSecretKey}`;
  const headers = { "Content-Type": "application/json" };
  const payload = {
    RelatedProspectId: leadId,
    ActivityEvent: 228, // Your activity event code
    ActivityNote: `Uploaded PDF: ${pdfName}`,
    Fields: [
      { SchemaName: "PDF Name", Value: pdfName },

      // Add other fields if needed
    ],
  };

  try {
    await axios.post(url, payload, { headers });
  } catch (error) {
    console.error("Error in updateActivity:", error);
    throw error;
  }
};

module.exports = { createOrUpdateLead, updateActivity };
