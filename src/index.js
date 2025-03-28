import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./App";
import { enableApiLogging } from "./utils/apiUtils";

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
