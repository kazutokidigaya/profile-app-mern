import React, { useState, useRef } from "react";
import axios from "axios";

const PDFUploader = () => {
  const [file, setFile] = useState(null);
  const [openAIResponse, setOpenAIResponse] = useState(null);
  const fileInputRef = useRef(null);

  // Handles file upload and analysis
  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        // Upload PDF
        const uploadResponse = await axios.post(
          "http://localhost:3000/api/pdfs/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Get the PDF ID
        const pdfId = uploadResponse.data.pdfId;

        // Process PDF
        const processResponse = await axios.get(
          `http://localhost:3000/api/pdfs/process/${pdfId}`
        );
        setOpenAIResponse(processResponse.data.openaiResponse);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    console.log(e.target.value);
  };

  // Trigger hidden file input when "Upload and Analyze" is clicked
  const handleButtonClick = () => {
    fileInputRef.current.click();
    fileInputRef.current.onchange = () => {
      if (fileInputRef.current.files[0]) {
        handleFileUpload();
      }
    };
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: "none" }} // Hide the file input
      />
      <button onClick={handleButtonClick}>Upload and Analyze</button>
      {openAIResponse && (
        <div>
          <h3>OpenAI Response:</h3>
          <p>{JSON.stringify(openAIResponse, null, 2)}</p>
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
