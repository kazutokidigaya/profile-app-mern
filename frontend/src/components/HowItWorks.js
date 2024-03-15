import React from "react";
import "./HowItWorks.scss";

export default function HowItWorks() {
  return (
    <div className="timeline">
      <div className="timeline__event animated fadeInUp delay-3s timeline__event--type1">
        <div className="timeline__event__icon">
          <img
            src="https://lh3.googleusercontent.com/ppyLgfi8sLFXo6WxGEIJqaUjBpgLkXiGzChzn6o3s6yGdMr_T3uxpgR7_l2Dd_I2JMvONFT8cSLjH3Z2cHL4JAvui6NAWe7SAg=s0"
            alt="Icon"
          />
        </div>
        <div className="timeline__event__date" style={{ color: "white" }}>
          1
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">Upload Your Resume/CV:</div>
          <div className="timeline__event__description">
            <p>
              Attach your most recent resume or CV. Our tool evaluates your
              academic achievements, professional experience, and
              extracurricular involvements.
            </p>
          </div>
        </div>
      </div>

      {/* Repeat the structure for other steps */}
      {/* Example for Step 2 */}
      <div className="timeline__event animated fadeInUp delay-2s timeline__event--type2">
        <div className="timeline__event__icon">
          <img
            src="https://lh3.googleusercontent.com/XDh4_FB1BCNxUk-OHZs1dEs3xA1HgKUAGfxQF93NlVgdM2WacbsZbbnXscQrGaBuiPk-l3Gn8QUhPJ-OyEGFnLaNEj_iZ2AKhQY=s0"
            alt="Icon"
          />
        </div>
        <div className="timeline__event__date" style={{ color: "white" }}>
          2
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">AI-Powered Analysis:</div>
          <div className="timeline__event__description">
            <p>
              Our advanced AI system assesses your profile, comparing it against
              criteria from various management programs for a comprehensive
              fitment analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline__event animated fadeInUp delay-1s timeline__event--type3">
        <div className="timeline__event__icon">
          <img
            src="https://lh3.googleusercontent.com/CwuUQ6-7UcqyYnvKZEpcIPvgZkF4lxH4DTuauDen_RoaVXmEjTqexmV3Tr1cDF441uhGir--qvCd8xHJl0WrjFC0srv_FkB1JEs=s0"
            alt="icon"
          />
        </div>
        <div style={{ color: "white" }} className="timeline__event__date">
          3
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">Fill Out a Brief Form:</div>
          <div className="timeline__event__description">
            <p style={{ paddingTop: "15px", paddingBottom: "15px" }}>
              Provide basic information to personalize your report and help us
              get in touch with you.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline__event animated fadeInUp timeline__event--type1">
        <div className="timeline__event__icon">
          <img
            src="https://lh3.googleusercontent.com/nDm0ct32wih4sTGP_d55-f-ezDrWy4OSNPPQ0wU4idBzZ51S3o1ADW0YEo_XF-Tl2tQVwTFND4KymNQ1K4x6YEvqAtzroYUgbw=s0"
            alt="icon"
          />
        </div>
        <div style={{ color: "white" }} className="timeline__event__date">
          4
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">
            Receive Your Personalized Report:
          </div>
          <div className="timeline__event__description">
            <p>
              Get a detailed report highlighting your alignment with management
              programs, showcasing your competitive edge and areas for growth.
            </p>
          </div>
        </div>
      </div>

      <div className="timeline__event animated fadeInUp delay-1s timeline__event--type3">
        <div className="timeline__event__icon">
          <img
            src="https://lh3.googleusercontent.com/kb39wVtoCM9qGBoiO09JR5F4q8eM8mE1cNr5biTFdCIe9X7a0FCAkl07SxofzExWK36Q-WHvD1OuwVDYUK5sb801sc9StaEheDY=s0"
            alt="icon"
          />
        </div>
        <div style={{ color: "white" }} className="timeline__event__date">
          5
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">
            Consultation with an Expert:
          </div>
          <div className="timeline__event__description">
            <p style={{ padding: "14.5px" }}>
              Schedule a call with a career expert to delve deeper into your
              results and discuss strategies for your management career journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
