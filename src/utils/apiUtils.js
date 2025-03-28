import axios from "axios";

// Utility function to log API calls in development
export const enableApiLogging = () => {
  // Only apply in development
  if (process.env.NODE_ENV === "development") {
    // Request interceptor
    axios.interceptors.request.use((request) => {
      console.log(
        "Starting API Request:",
        request.method?.toUpperCase(),
        request.url
      );
      console.log("Request headers:", request.headers);

      if (request.data) {
        console.log(
          "Request data:",
          typeof request.data === "string"
            ? request.data
            : JSON.stringify(request.data)
        );
      }

      return request;
    });

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.status, response.config.url);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(
            "API Error Response:",
            error.response.status,
            error.config.url
          );
          console.error("Error data:", error.response.data);
        } else if (error.request) {
          console.error("API Request Error:", error.message);
        } else {
          console.error("API Error:", error.message);
        }
        return Promise.reject(error);
      }
    );
  }
};

// Function to check if API keys are properly configured
export const checkApiKeys = () => {
  const missing = [];

  if (!process.env.REACT_APP_ASSEMBLY_API_KEY) {
    missing.push("REACT_APP_ASSEMBLY_API_KEY");
  }

  if (!process.env.REACT_APP_DEEPSEEK_API_KEY) {
    missing.push("REACT_APP_DEEPSEEK_API_KEY");
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};
