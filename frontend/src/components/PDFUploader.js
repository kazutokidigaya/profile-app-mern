import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import toast, { Toaster } from "react-hot-toast";

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
  const fileInputRef = useRef(null);
  const analysisSectionRef = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setParam({
      source: queryParams.get("utm_source") || "",
      campaign: queryParams.get("utm_campaign") || "",
      medium: queryParams.get("utm_medium") || "",
    });
  }, []);

  const handleUserDataChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleMobileChange = (value) => {
    setUserData({ ...userData, mobile: value });
  };

  const handleSendOTP = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/users/send-otp`, {
        mobile: userData.mobile,
      });
      toast.success("OTP sent successfully!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("Error sending OTP.");
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const response = await axios.post(
        ` ${process.env.REACT_APP_API_URL}/users/verify-otp`,
        { mobile: userData.mobile, code: userData.otp }
      );
      if (response.data.verification === "approved") {
        setOtpPending(false);
        setOtpVerified(true);
        setShowOTPForm(false);
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
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  // Handles file upload
  const handleFileUpload = async (selectedFile) => {
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

    const formData = new FormData();
    formData.append("file", selectedFile);
    setProgress(20);
    setIsLoading(true);
    setStatusMessage("Uploading your resume...");

    setTimeout(() => {
      setProgress(40); // Set progress to 40% after file upload
      setStatusMessage("Analysing your profile...");
    }, 1000);
    try {
      // Upload PDF and process with OpenAI in one step
      const uploadResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/pdfs/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Wait for 2 seconds before simulating the AI processing
      setTimeout(() => {
        setProgress(60); // Set progress to 80% to simulate AI processing
        setStatusMessage("Creating your personalized report...");

        // Simulate the completion of AI processing after 2 more seconds
        setTimeout(() => {
          setUploadedPdfId(uploadResponse.data.pdfId); // Store the uploaded PDF ID
          setOpenAIResponse(uploadResponse.data.openaiResponses); // Assuming the backend sends an array of OpenAI responses
          setShowOTPForm(true);
          toast.success("Response generated successfully!");
          setStatusMessage("Done!");
          setIsLoading(false); // Set loading to false when everything is done
        }, 1000);
      }, 2000);
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
    fileInputRef.current.click();
  };

  const downloadAIResponsePdf = async () => {
    if (openAIResponse) {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/pdfs/generate-pdf`,
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
            <h1>
              Evaluate Your Fitment for a{" "}
              <span className="blue-color-text">Management Program</span>
            </h1>
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
            How to Use this Tool to Evaluate Your Profile and{" "}
            <span className="blue-color-text">Plan Your Next Steps</span>
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
      <hr className="custom-hr" />

      <div ref={analysisSectionRef} className="analysis-section">
        <h2 className="section-title">
          Resume <span className="blue-color-text">Analysis</span>
        </h2>
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

          {!attempts && (
            <p className="usage-message">
              You have used your max allocated usage.
            </p>
          )}
          {attempts && otpVerified && (
            <div className="download-button-container">
              <button className="upload-button" onClick={downloadAIResponsePdf}>
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
            </div>
          )}
        </div>
      </div>
      <hr className="custom-hr" />
      <div className="insights-section">
        <h2>
          Ready to Turn{" "}
          <span className="blue-color-text">Insights into Action?</span>
        </h2>
        <p>
          Completing your profile evaluation is just the beginning. Connect with
          a career advisor to understand your analysis and map out your
          personalized path to a management program. They're ready to help you
          strategize and answer any questions
        </p>
        <button className="upload-button">Schedule My Free Call</button>
      </div>
      <footer>
        <div className="footerbar">
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
          <p>All Copyrights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PDFUploader;
