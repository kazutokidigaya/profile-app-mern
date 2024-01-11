import React, { useState, useRef } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PDFUploader = () => {
  const [uploadedPdfId, setUploadedPdfId] = useState(null);
  const [openAIResponse, setOpenAIResponse] = useState(null);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    otp: "",
  });

  const [otpVerified, setOtpVerified] = useState(false);
  const fileInputRef = useRef(null);

  const handleUserDataChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleMobileChange = (value) => {
    setUserData({ ...userData, mobile: value });
  };

  const handleSendOTP = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/send-otp",
        { mobile: userData.mobile }
      );
      console.log("OTP sent response:", response.data);
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/verify-otp",
        { mobile: userData.mobile, code: userData.otp }
      );
      console.log(response);
      if (response.data.verification === "approved") {
        setOtpVerified(true);
        console.log(otpVerified);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };

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
      setShowOTPForm(!showOTPForm);
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
  // const downloadPdf = async () => {
  //   if (uploadedPdfId) {
  //     try {
  //       const response = await axios.get(
  //         `http://localhost:3000/api/pdfs/download/${uploadedPdfId}`,
  //         {
  //           responseType: "blob",
  //         }
  //       );
  //       const url = window.URL.createObjectURL(new Blob([response.data]));
  //       const link = document.createElement("a");
  //       link.href = url;
  //       link.setAttribute("download", "downloaded.pdf"); // Set the file name
  //       document.body.appendChild(link);
  //       link.click();
  //     } catch (error) {
  //       console.error("Error downloading file:", error);
  //     }
  //   }
  // };

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

  {
    /* {uploadedPdfId && (
    <button onClick={downloadPdf}>Download Uploaded PDF</button>
  )} */
  }

  return (
    <div style={{ margin: "20px" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: "none" }}
      />
      <button onClick={handleButtonClick}>Upload PDF</button>

      {openAIResponse &&
        openAIResponse.map((response, index) => (
          <div>
            <div key={index}>
              <p>{response}</p>
            </div>
          </div>
        ))}

      {showOTPForm && (
        <div style={formStyle}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleUserDataChange}
            style={inputStyle}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleUserDataChange}
            style={inputStyle}
          />
          <PhoneInput
            country={"in"}
            value={userData.mobile}
            onChange={handleMobileChange}
          />
          <input
            type="text"
            name="otp"
            placeholder="OTP"
            onChange={handleUserDataChange}
            style={inputStyle}
          />
          <button
            onClick={handleSendOTP}
            disabled={otpVerified}
            style={buttonStyle}
          >
            Send OTP
          </button>
          <button
            onClick={handleVerifyOTP}
            disabled={otpVerified}
            style={buttonStyle}
          >
            Verify OTP
          </button>
          {otpVerified && <div>OTP Verified Successfully</div>}
        </div>
      )}
      {otpVerified && (
        <button onClick={downloadAIResponsePdf}>
          Download AI Response as PDF
        </button>
      )}
    </div>
  );
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  maxWidth: "300px",
  margin: "auto",
};

const inputStyle = {
  marginBottom: "10px",
  padding: "10px",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  marginBottom: "10px",
};

export default PDFUploader;
