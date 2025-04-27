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

      return request;
    });

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
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
