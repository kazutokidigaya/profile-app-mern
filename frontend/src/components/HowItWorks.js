import React from "react";
import "./HowItWorks.scss";

export default function HowItWorks() {
  return (
    <div className="timeline">
      <div className="timeline__event animated fadeInUp delay-3s timeline__event--type1">
        <div className="timeline__event__icon">
          <img src="/icon-1.png" alt="Icon" width="80px" />
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
          <img src="/icon-2.png" alt="Icon" width="80px" />
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
          <img src="/icon-3.png" alt="Icon" width="80px" />
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
          <img src="/icon-4.png" alt="Icon" width="80px" />
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
          <img src="/icon-5.png" alt="Icon" width="80px" />
        </div>
        <div style={{ color: "white" }} className="timeline__event__date">
          5
        </div>
        <div className="timeline__event__content">
          <div className="timeline__event__title">
            Consultation with an Expert:
          </div>
          <div className="timeline__event__description">
            <p style={{ padding: "8.1px" }}>
              Schedule a call with a career expert to delve deeper into your
              results and discuss strategies for your management career journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
