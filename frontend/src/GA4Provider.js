import React, { useEffect } from "react";
import ReactGA from "react-ga4"; // Import the default export

export const GA4Provider = ({ children }) => {
  useEffect(() => {
    ReactGA.initialize(process.env.REACT_APP_GA4_KEY); // Ensure you're using REACT_APP_ prefix for environment variables
  }, []);

  return <>{children}</>;
};
