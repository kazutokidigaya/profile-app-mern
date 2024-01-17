import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast, { Toaster } from "react-hot-toast";
import { ThreeCircles } from "react-loader-spinner";
import "./pdfuploader.css";

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

  const [otpPending, setOtpPending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [attempts, setAttempts] = useState(true);
  const [param, setParam] = useState({
    source: "",
    campaign: "",
    medium: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setParam({
      source: queryParams.get("utm_source") || "",
      campaign: queryParams.get("utm_campaign") || "",
      medium: queryParams.get("utm_medium") || "",
    });
  }, []);

  console.log(param);
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
      console.log("OTP sent response:", response.data, userData.mobile);
      toast.success("OTP sent successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP.");
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
        setOtpPending(false);
        setOtpVerified(true);
        await registerUser();
        toast.success("OTP verified successfully!");
      }
      if (response.data.verification === "pending") {
        setOtpPending(true);
        toast.error("OTP incorrect!");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Error verifying OTP.");
    }
  };

  const registerUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/register",
        {
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          pdfId: uploadedPdfId,
          ...param,
        }
      );
      if (response.data.message === "You have used your max allocated usage.") {
        setAttempts(false);
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  // Handles file upload
  const handleFileUpload = async (selectedFile) => {
    const formData = new FormData();
    formData.append("file", selectedFile);
    setIsLoading(true);
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
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error Uploading File");
    }
    setIsLoading(false);
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

  const downloadAIResponsePdf = async () => {
    if (openAIResponse) {
      try {
        const response = await axios.post(
          `http://localhost:3000/api/pdfs/generate-pdf`,
          {
            responses: openAIResponse,
            name: userData.name,
          },
          { responseType: "blob" } // This ensures you get the response as a Blob
        );
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "ai_responses.pdf");
        document.body.appendChild(link);
        link.click();
        toast.success("PDF downloaded successfully!");
      } catch (error) {
        console.error("Error downloading AI response PDF:", error);
      }
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
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

  {
    /* {uploadedPdfId && (
    <button onClick={downloadPdf}>Download Uploaded PDF</button>
  )} */
  }

  return (
    <div className="mian_container">
      <div>
        <nav>
          <div className="navbar">
            <img
              src="https://lh3.googleusercontent.com/4MwUs0FiiSAX_d8ORJWpmp-xn1ifvguLFtr-x7vu_Km6CvmXUzE_pmbRW90uLOiPwbEneFAeXaJ-8gwtT2nAdVLsSYIsod2MrD8=s0"
              alt="Logo"
              className="navbar-logo"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              style={{ display: "none" }}
            />
            <button onClick={handleButtonClick} className="upload-button">
              Upload My Resume
            </button>
          </div>
        </nav>
        <div className="profile-evaluation-section">
          <div className="text-container">
            <h1>Evaluate Your Fitment for a Management Program</h1>
            <p>
              Use our Profile Evaluation Tool to assess your readiness for
              management programs. Simply upload your resume or CV, and our tool
              will analyze your fitment for various management courses.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              style={{ display: "none" }}
            />
            <button onClick={handleButtonClick} className="upload-button">
              Upload My Resume
            </button>
          </div>
          <div className="image-container">
            <img
              src="https://lh3.googleusercontent.com/3tEeGNkBJnXg0N9dJu7oumnaFtmUKCcZl-cOKlhAYBtE3VvqmDf0W9HFBHCVBEOoH4Szf9QpOlSrgBRL4q4vOYdll1_GHiVL1eE=w380"
              alt="Profile Evaluation"
            />
          </div>
        </div>
        <div className="management-journey-section">
          <div className="management-text">
            <p>
              Embarking on a management journey requires insight, preparation,
              and the right fit. That's where we come in! Our Profile Evaluation
              Tool is designed to illuminate your path to success in the
              management realm.
              <br />
              <br />
              Just upload your resume or CV, and let us do the rest.
              <br />
              <br />
              What will you get? A comprehensive analysis tailored to your
              profile, showcasing how you align with various management
              programs. It's straightforward, insightful, and completely
              tailored to you.
            </p>
          </div>
        </div>

        <div className="how-to-use-section">
          <h2>
            How to Use this Tool to Evaluate Your Profile and Plan Your Next
            Steps
          </h2>
          <div className="cards-container">
            <div className="card">
              <img
                src="https://lh3.googleusercontent.com/olj0WNmHgUOjQYpi8WjfHZEG95Ny7MQqZUplro5kSgy8UviHO0cRgROUK2fQDfiCdqvXlqNqJcwx98lWeDe2Xr080tkDK-mnCw=s0"
                width="80"
                alt=""
              />
              <div>
                <h3>Step 1: Fill Out a Brief Form</h3>
                <p>
                  Start your journey by providing some basic information about
                  yourself and your career aspirations. This will help us tailor
                  the evaluation to your unique profile.
                </p>
              </div>
            </div>
            <div className="card">
              <img
                src="https://lh3.googleusercontent.com/ly8yPCJu3jBCYghmMQdiwryUJz0_s6MfkyHBZ__9qHwyXiaAFmtUfK1erZq00bOiO1voJlfygoCdJlL9rnbry_Kh__-I1G6pXjQ=s0"
                width="80"
                alt=""
              />

              <div>
                <h3>Step 2: Upload Your Resume/CV</h3>
                <p>
                  Attach your most recent resume or CV. Our tool uses this
                  information to assess your academic background, professional
                  experience, and extracurricular activities.
                </p>
              </div>
            </div>
            <div className="card">
              <img
                src="https://lh3.googleusercontent.com/Hgo4hXEglNPL3a3RCxsO8olfECbM0TdRJowG6HE0ltOwT-YZx9jivimyYZfmo2SGI9G608O0NhliqeuOGKQAh-e5Loe3rnj5o50=s0"
                width="80"
                alt=""
              />

              <div>
                <h3>Step 3: Wait for Our AI to Do Its Magic</h3>
                <p>
                  Sit back and relax while our advanced AI analyzes your
                  details. It cross references your profile with management
                  program criteria to provide a comprehensive evaluation.
                </p>
              </div>
            </div>
            <div className="card">
              <img
                src="https://lh3.googleusercontent.com/_5-f_4KVVazwOzzDFjL47Oiq1P6mhmbGES82m_m1AAITzIC4yq3EMUfVux1EN09Z2IKC_CEL0VZXwRvm_d5aVEwPgbu8KteKyvVE=s0"
                width="80"
                alt=""
              />

              <div>
                <h3>Step 4: View Your Analysis</h3>
                <p>
                  Receive a detailed report on your fitment for management
                  programs. Understand your strengths, areas for improvement,
                  and how you compare to typical program candidates
                </p>
              </div>
            </div>
            <div className="card">
              <img
                src="https://lh3.googleusercontent.com/CpXc5hbW4jh9PxeAJP9uAtsWG9LtlAAZGKdzjkFEGabYiFjGeQjRVBdmVxXS9zvbzmVouyO0PkJsxXX5uCpCkL2eHly1HgZjag=s0"
                width="80"
                alt=""
              />

              <div>
                <h3>Step 5: Schedule a Call with an Expert</h3>
                <p>
                  Take it further by scheduling a consultation with one of our
                  experts. They will help you interpret your results and discuss
                  your next steps towards management success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr class="custom-hr" />

      <div className="main_container">
        <div className="analysis-section">
          <h2 className="section-title">Resume Analysis</h2>
          <Toaster position="top-right" />
          <div className="upload-section">
            <div
              className="drag-drop-box"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: "none" }}
              />
              <img
                src="https://lh3.googleusercontent.com/QqIro2iF868BmqZARB7u_JvZ_CR9JDOzQhdsDCngPsBOuXYlEj6_1-fnq4FPOyBs0mQbFJQdz_sXPKfIGOkSpmDCYPiRY7XF3p8=s0"
                alt="Upload Icon"
                width={80}
                className="upload-icon"
              />
              <p>Drag and drop, or click to upload</p>
            </div>

            {openAIResponse &&
              openAIResponse.map((response, index) => (
                <div>
                  <div key={index}>
                    <p>{response}</p>
                  </div>
                </div>
              ))}
            {attempts && showOTPForm && (
              <div className="pop-up-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  onChange={handleUserDataChange}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleUserDataChange}
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
                />
                <button onClick={handleSendOTP} disabled={otpVerified}>
                  Send OTP
                </button>
                <button onClick={handleVerifyOTP} disabled={otpVerified}>
                  Verify OTP
                </button>
                {otpVerified && <div>OTP Verified Successfully</div>}
                {otpPending && <div>please enter correct otp</div>}
              </div>
            )}
            {attempts && otpVerified && (
              <button onClick={downloadAIResponsePdf}>
                Download AI Response as PDF
              </button>
            )}
            {!attempts && <p>You have used your max allocated usage.</p>}
          </div>
          {isLoading && (
            <ThreeCircles
              color="#00BFFF"
              height={100}
              width={100}
              // other props you may need
            />
          )}
        </div>
        <div>
          <h2></h2>
          <p></p>
          <button></button>
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;
