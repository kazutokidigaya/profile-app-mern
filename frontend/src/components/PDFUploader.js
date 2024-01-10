import React, { useState, useRef } from "react";
import axios from "axios";

const PDFUploader = () => {
  const [uploadedPdfId, setUploadedPdfId] = useState(null);
  const [openAIResponse, setOpenAIResponse] = useState(null);
  const fileInputRef = useRef(null);

  // Handles file upload
  const handleFileUpload = async (selectedFile) => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Upload PDF and process with OpenAI in one step
      const uploadResponse = await axios.post(
        "http://localhost:3000/api/pdfs/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadedPdfId(uploadResponse.data.pdfId); // Store the uploaded PDF ID
      setOpenAIResponse(uploadResponse.data.openaiResponses); // Assuming the backend sends an array of OpenAI responses
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  // Trigger hidden file input when button is clicked
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Function to download the uploaded PDF
  const downloadPdf = async () => {
    if (uploadedPdfId) {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/pdfs/download/${uploadedPdfId}`,
          {
            responseType: "blob",
          }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "downloaded.pdf"); // Set the file name
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error downloading file:", error);
      }
    }
  };

  const downloadAIResponsePdf = async () => {
    if (openAIResponse) {
      try {
        const response = await axios.post(
          `http://localhost:3000/api/pdfs/generate-pdf`,
          { responses: openAIResponse },
          { responseType: "blob" }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "ai_responses.pdf");
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error downloading AI response PDF:", error);
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: "none" }}
      />
      <button onClick={handleButtonClick}>Upload PDF</button>
      {uploadedPdfId && (
        <button onClick={downloadPdf}>Download Uploaded PDF</button>
      )}
      {openAIResponse && (
        <button onClick={downloadAIResponsePdf}>
          Download AI Response as PDF
        </button>
      )}
      {openAIResponse &&
        openAIResponse.map((response, index) => (
          <div>
            <div key={index}>
              <p>{response}</p>
            </div>
          </div>
        ))}
    </div>
  );
};

export default PDFUploader;
