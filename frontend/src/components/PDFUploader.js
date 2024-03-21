import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast, { Toaster } from "react-hot-toast";
import HowItWorks from "./HowItWorks";
import ReactGA from "react-ga4";

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
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [processId, setProcessId] = useState("");
  const fileInputRef = useRef(null);
  const analysisSectionRef = useRef(null);

  // Ref for keeping the up-to-date processId
  const processIdRef = useRef(processId);

  const [currentQuote, setCurrentQuote] = useState("");

  const quotes = [
    "GMAT/GRE scores are key in MBA applications, showcasing academic readiness.",
    "Programs like Harvard and Stanford assess candidates holistically, valuing essays and work experience.",
    "Campus visits and info sessions are crucial for understanding a program's culture.",
    "Recommendation letters provide deep insights into an applicant's professional skills.",
    "MBA essays highlight personal journeys and career goals, aligning with program benefits.",
    "Interviews are pivotal, testing communication skills and program fit.",
    "Financial planning, including scholarships, is crucial for high ROI schools like INSEAD.",
    "Specializations matter; MIT Sloan is known for innovation and entrepreneurship.",
    "Early application rounds often offer better admission and scholarship chances.",
    "Engaging with alumni offers valuable insights into program experiences.",
  ];

  // Function to select a random quote
  const updateQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setParam({
      source: queryParams.get("utm_source") || "",
      campaign: queryParams.get("utm_campaign") || "",
      medium: queryParams.get("utm_medium") || "",
    });
  }, []);

  useEffect(() => {
    processIdRef.current = processId;
  }, [processId]);

  // Define a ref to store the quote update interval ID
  const quoteUpdateIntervalRef = useRef(null);

  useEffect(() => {
    updateQuote();

    quoteUpdateIntervalRef.current = setInterval(() => {
      updateQuote(); // Call your function to update the quote
    }, 4500);

    return () => {
      clearInterval(quoteUpdateIntervalRef.current); // Clear the interval on component unmount
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  useEffect(() => {
    const ws = new WebSocket(`wss:${process.env.REACT_APP_WEB_SOCKET_API_URL}`);

    ws.onopen = () => {
      const newProcessId = `process-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;
      setProcessId(newProcessId); // Update the state
      ws.send(JSON.stringify({ type: "processId", processId: newProcessId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Use the ref's current value for comparison
        if (data.processId && data.processId === processIdRef.current) {
          setProgress(data.progress);
          setStatusMessage(data.message);

          if (data.progress === 100) {
            setIsLoading(false); // Hide loader when process is complete
            // Clear the quote update interval when loading is complete
            clearInterval(quoteUpdateIntervalRef.current);
          }
        } else {
          console.error(
            "Message received for a different or undefined processId."
          );
        }
      } catch (error) {
        console.error("Error parsing message JSON:", error);
      }
    };

    return () => ws.close();
  }, []);

  const handleUserDataChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleMobileChange = (value) => {
    setUserData({ ...userData, mobile: value });
  };

  const handleSendOTP = async () => {
    if (!userData.name || !userData.email || !userData.mobile) {
      toast.error("Please fill in all the details");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/users/send-otp`, {
        mobile: userData.mobile,
      });
      toast.success("OTP sent successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Adjust the error message based on the response from the server
      const errorMessage =
        error.response?.data?.message || "Error sending OTP.";
      toast.error(errorMessage);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/verify-otp`,
        {
          sessionUuid: userData.sessionUuid,
          otp: userData.otp,
          mobile: userData.mobile,
        } // Ensure you're passing sessionUuid now
      );
      if (response.status === 200) {
        setOtpPending(false);
        setOtpVerified(true);
        setShowOTPForm(false);
        await registerUser();
        toast.success("OTP verified successfully!");
      }
      if (response.status === 400) {
        setOtpPending(true);
        setOtpVerified(false);
        toast.error("OTP incorrect!");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpVerified(false);
      // Adjust the error message based on the response from the server
      const errorMessage =
        error.response?.data?.message || "Error verifying OTP.";
      toast.error(errorMessage);
    }
  };

  const registerUser = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/users/register`,
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
        return toast.error(
          "You have Used The Max Allocated Usage for This Number"
        );
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  // Handles file upload
  const handleFileUpload = async (selectedFile) => {
    setIsLoading(true);
    setAttempts(true);
    setOtpPending(false);
    setOtpVerified(false);
    setShowOTPForm(false);
    setOpenAIResponse(null);
    setUserData({
      name: "",
      email: "",
      mobile: "",
      otp: "",
    });
    analysisSectionRef.current.scrollIntoView({ behavior: "smooth" });

    ReactGA.event("file_upload", {
      file_name: selectedFile.name,
      content_type: selectedFile.type,
    });

    const formData = new FormData();
    formData.append("file", selectedFile);
    const config = {
      onUploadProgress: () => {},
      headers: { "Content-Type": "multipart/form-data" },
    };

    setProgress(20);
    setStatusMessage("Uploading your resume...");
    try {
      // Upload PDF and process with OpenAI in one step
      const uploadResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/pdfs/upload?processId=${processId}`,
        formData,
        config
      );

      setUploadedPdfId(uploadResponse.data.pdfId); // Store the uploaded PDF ID
      setOpenAIResponse(uploadResponse.data.openaiResponses); // Assuming the backend sends an array of OpenAI responses
      setShowOTPForm(true);
      toast.success("Response generated successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.response.data.message);
      setIsLoading(false); // Set loading to false in case of error
      setStatusMessage("Failed to upload and process PDF.");
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
    analysisSectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const capitalizeFirstLetterOfEachWord = (str) => {
    const words = str.split(" ");
    if (words.length === 0) return str;
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 0) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
      }
    }

    return words.join(" ");
  };

  const downloadAIResponsePdf = async () => {
    if (openAIResponse) {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/pdfs/generate-pdf`,
          {
            responses: openAIResponse,
            name: capitalizeFirstLetterOfEachWord(userData.name),
          },
          { responseType: "blob" } // This ensures you get the response as a Blob
        );
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${userData.name}_analysis.pdf`);
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

  const getLimitedWords = (text, limit = 80) => {
    const words = text.split(" ");
    return (
      words.slice(0, limit).join(" ") + (words.length > limit ? "..." : "")
    );
  };

  const triggerFileInputClick = () => {
    fileInputRef.current.click();
  };
  return (
    <div className="mian_container">
      <div>
        <nav>
          <div className="navbar">
            <a href="https://crackverbals-6.webflow.io/">
              <img
                src="/crackverbal-logo.png"
                alt="Logo"
                className="navbar-logo"
              />
            </a>

            <button onClick={handleButtonClick} className="upload-button">
              Upload My Resume
            </button>
          </div>
        </nav>
        <div className="profile-eval-parent">
          <div className="profile-evaluation-section">
            <div className="image-container">
              <img src="/9.png" alt="Profile Evaluation" />
            </div>
            <div className="text-container">
              <h1>
                Evaluate Your Fitment for a{" "}
                <span className="blue-color-text">Management Program</span>
              </h1>
              <p>
                Discover Your Potential with Our Advanced Profile Evaluation
                Tool. Upload Your Resume and Begin Your Journey.
              </p>

              <button onClick={handleButtonClick} className="upload-button">
                Upload My Resume
              </button>
            </div>
          </div>
        </div>

        <div className="management-journey-section">
          <h2 className="section-title">
            Why Use Our
            <span className="blue-color-text"> Profile Evaluation Tool?</span>
          </h2>
          <div className="management-card-main">
            <div className="management-card">
              <img src="/12.png" alt="card1" />
              <h3 className="blue-color-text">Tailored Analysis:</h3>
              <p>
                Receive a detailed analysis of your academic and professional
                background, personalized to align with various management
                programs.
              </p>
            </div>
            <div className="management-card">
              <img src="/15.png" alt="card2" />
              <h3 className="blue-color-text">Insightful Feedback:</h3>
              <p>
                Understand how your profile fits with management program
                expectations, including your strengths and areas for
                improvement.
              </p>
            </div>
            <div className="management-card" style={{ paddingBottom: "7.5vh" }}>
              <img src="/14.png" alt="card3" />
              <h3 className="blue-color-text">Simple and Effective:</h3>
              <p>
                Just upload your resume or CV, and our tool takes care of the
                rest, providing straightforward and insightful results.
              </p>
            </div>
          </div>
        </div>

        <div className="how-it-works-parent">
          <h2 className="section-title">
            <span className="blue-color-text">How It Works: </span>
            Your Path to Management Program Readiness
          </h2>
          <HowItWorks />
        </div>
      </div>
      <div className="analysis-section-parent">
        <div ref={analysisSectionRef} className="analysis-section">
          <h2 className="section-title">
            Resume <span className="blue-color-text">Analysis</span>
          </h2>
          <Toaster position="top-right" duration="4000" />
          <div className="upload-section">
            <div
              className="drag-drop-box"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInputClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: "none" }}
              />
              <img
                src="/Group-179.png"
                alt="Upload Icon"
                width={100}
                className="upload-icon"
              />
              <p>Drag and drop, or click to upload</p>
            </div>

            {openAIResponse && openAIResponse.length > 0 && (
              <div>
                <div className="ai-response-box">
                  <p>{getLimitedWords(openAIResponse[0])}</p>
                </div>
                {showOTPForm && (
                  <p>If you wish to know more, please register the form.</p>
                )}
              </div>
            )}

            {attempts && showOTPForm && (
              <div className="form-main">
                <input
                  className="form-input"
                  type="text"
                  name="name"
                  placeholder="Name"
                  onChange={handleUserDataChange}
                />
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleUserDataChange}
                />
                <div className="form-row">
                  <PhoneInput
                    country={"in"}
                    value={userData.mobile}
                    onChange={handleMobileChange}
                    containerClass="phone-container"
                    inputClass="phone-input"
                  />
                  <button
                    className="otp-button send-otp"
                    onClick={handleSendOTP}
                    disabled={otpVerified}
                  >
                    Send OTP
                  </button>
                </div>
                <div className="form-row">
                  <input
                    className="otp-input"
                    type="text"
                    name="otp"
                    placeholder="OTP"
                    onChange={handleUserDataChange}
                  />
                  <button
                    className="otp-button verify-otp"
                    onClick={handleVerifyOTP}
                    disabled={otpVerified}
                  >
                    Verify OTP
                  </button>
                </div>
                {otpVerified && (
                  <div className="status-message success">
                    OTP Verified Successfully
                  </div>
                )}
                {otpPending && (
                  <div className="status-message error">
                    Please enter correct OTP
                  </div>
                )}
              </div>
            )}

            {attempts && otpVerified && (
              <div className="download-button-container">
                <button
                  className="upload-button"
                  onClick={downloadAIResponsePdf}
                >
                  Download Response
                </button>
              </div>
            )}

            {isLoading && (
              <div className="progress-bar-container">
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p>{statusMessage}</p>
                <p className="motivational-quote">{currentQuote}</p>{" "}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="insights-section-main">
        <div className="insights-section">
          <h2>
            Ready to Turn{" "}
            <span style={{ color: "#0029e4" }}>Insights into Action?</span>
          </h2>
          <p>
            Completing your profile evaluation is just the beginning. Connect
            with a career advisor to understand your analysis and map out your
            personalized path to a management program. They're ready to help you
            strategize and answer any questions
          </p>
          <button
            className="upload-button-white"
            onClick={() => {
              window.location.href =
                "https://calendly.com/studentsupport-1/counselling-call-crackverbal?utm_source=profile-app&utm_campaign=profile-eval&utm_medium=profile-page";
            }}
          >
            Consult with a Career Advisor
          </button>
        </div>
      </div>
      <footer>
        <div className="footer">
          <a href="https://crackverbals-6.webflow.io/">
            <img
              src="/crackverbal-logo.png"
              alt="Logo"
              className="navbar-logo"
            />
          </a>
          <div className="footer-list-item">
            <div>
              <a href="https://crackverbals-6.webflow.io/">
                © 2024 Crackverbal
              </a>
            </div>
            <div>
              <a href="https://crackverbals-6.webflow.io/">Terms</a>{" "}
            </div>
            <div>
              <a href="https://crackverbals-6.webflow.io/">Privacy</a>
            </div>
            <div>
              <a href="https://crackverbals-6.webflow.io/">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PDFUploader;
