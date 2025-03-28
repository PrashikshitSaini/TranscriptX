import axios from "axios";

// AssemblyAI API endpoints
const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";

// API key
const API_KEY = "60bea822bb9a4e7fac97ba0b6bb0f966";

// Configure axios with default headers for all API calls
const assemblyInstance = axios.create({
  headers: {
    Authorization: API_KEY,
    "Content-Type": "application/json",
  },
});

// Upload file to AssemblyAI
async function uploadFile(file, onProgress) {
  try {
    // Read file as array buffer
    const fileData = await readFileAsArrayBuffer(file);
    onProgress(20);

    // Direct upload approach
    const response = await axios.post(UPLOAD_URL, fileData, {
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/octet-stream",
      },
    });

    onProgress(50);
    console.log("File upload successful, URL:", response.data.upload_url);
    return response.data.upload_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(
      "Failed to upload audio. " +
        (error.response?.data?.error || error.message)
    );
  }
}

// Helper function to read file as array buffer
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsArrayBuffer(file);
  });
}

// Request transcription
async function requestTranscription(audioUrl, onProgress) {
  try {
    onProgress(60);
    console.log("Requesting transcription for URL:", audioUrl);

    // Make sure we're sending the correct format
    const requestData = {
      audio_url: audioUrl,
    };

    // Log the request for debugging
    console.log("Sending transcription request:", JSON.stringify(requestData));

    // Send the request
    const response = await assemblyInstance.post(TRANSCRIPT_URL, requestData);

    // Log the response for debugging
    console.log("Transcription request response:", response.data);

    onProgress(70);
    return response.data.id;
  } catch (error) {
    // Detailed error logging
    console.error("Transcription request error:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    throw new Error(
      "Failed to request transcription. " +
        (error.response?.data?.error || error.message)
    );
  }
}

// Check transcription status
async function checkTranscriptionStatus(transcriptId) {
  try {
    const response = await assemblyInstance.get(
      `${TRANSCRIPT_URL}/${transcriptId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error checking transcription status:", error);
    throw new Error(
      "Failed to check transcription status. " +
        (error.response?.data?.error || error.message)
    );
  }
}

// Transcribe audio file
export const transcribeWithAssemblyAI = async (file, onProgress) => {
  try {
    onProgress(10);
    console.log("Starting transcription for file:", file.name);

    // Step 1: Upload the file
    const uploadUrl = await uploadFile(file, onProgress);

    // Step 2: Request transcription
    const transcriptId = await requestTranscription(uploadUrl, onProgress);

    // Step 3: Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes with 2-second interval

    onProgress(75);
    console.log("Polling for transcription completion, ID:", transcriptId);

    while (attempts < maxAttempts) {
      // Sleep for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check status
      const checkResponse = await checkTranscriptionStatus(transcriptId);
      const status = checkResponse.status;

      console.log(
        `Transcription status: ${status} (attempt ${
          attempts + 1
        }/${maxAttempts})`
      );

      // Update progress (75% to 95%)
      const progressValue = 75 + (attempts / maxAttempts) * 20;
      onProgress(Math.min(95, progressValue));

      if (status === "completed") {
        onProgress(100);
        return checkResponse.text;
      } else if (status === "error") {
        throw new Error(
          `Transcription failed: ${checkResponse.error || "Unknown error"}`
        );
      }

      attempts++;
    }

    throw new Error("Transcription timed out");
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

// Function to test if API key is valid
export const testApiKey = async () => {
  try {
    const response = await assemblyInstance.get(
      "https://api.assemblyai.com/v2/account"
    );
    return { valid: true, data: response.data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
