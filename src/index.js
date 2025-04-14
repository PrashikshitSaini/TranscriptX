import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import { enableApiLogging } from "./utils/apiUtils";
import { Buffer } from "buffer";

// Make sure global objects are available
window.Buffer = window.Buffer || Buffer;

// Make sure process is defined
if (typeof process === "undefined") {
  window.process = require("../src/polyfills/process-browser.js");
}

// Enable API logging in development
enableApiLogging();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Conditionally import reportWebVitals
try {
  const reportWebVitals = require("./reportWebVitals").default;
  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
} catch (err) {
  console.log("Web vitals reporting not available");
}
