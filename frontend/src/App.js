import React from "react";
import PDFUploader from "./components/PDFUploader";
import "./App.css";
import { GA4Provider } from "./GA4Provider";

function App() {
  return (
    <GA4Provider>
      <div className="App">
        <PDFUploader />
      </div>
    </GA4Provider>
  );
}

export default App;
