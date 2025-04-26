import axios from "axios";

// Backend API endpoints (relative paths)
const API_BASE_URL = "/api";
const UPLOAD_API_URL = `${API_BASE_URL}/upload`;
const TRANSCRIPTION_API_URL = `${API_BASE_URL}/transcription`;

// Upload file to our backend server, which will upload it to AssemblyAI
async function uploadFileToServer(file, onProgress) {
  try {
    const formData = new FormData();
    formData.append("audio", file);

    onProgress(20);

    // Call backend upload endpoint which will upload to AssemblyAI
    const response = await axios.post(UPLOAD_API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    onProgress(50);

    // The server now gives us the AssemblyAI URL directly, no need for manipulation
    const assemblyUrl = response.data.url;

    console.log("File uploaded to AssemblyAI, received URL:", assemblyUrl);

    // Return the AssemblyAI upload_url directly
    return assemblyUrl;
  } catch (error) {
    console.error("Backend upload error:", error);
    throw new Error(
      "Failed to upload audio to server. " +
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

// Request transcription via our backend server
async function requestTranscriptionViaServer(audioUrl, onProgress) {
  try {
    onProgress(60);
    console.log("Requesting transcription via backend for URL:", audioUrl);

    // Call your backend transcription endpoint
    const response = await axios.post(TRANSCRIPTION_API_URL, {
      audioUrl: audioUrl, // This is now AssemblyAI's upload_url
    });

    onProgress(70);
    console.log("Backend transcription request response:", response.data);
    if (!response.data.id) {
      throw new Error("Backend did not return a transcription ID.");
    }
    return response.data.id;
  } catch (error) {
    console.error("Backend transcription request error:", error);
    throw new Error(
      "Failed to request transcription via backend. " +
        (error.response?.data?.error || error.message)
    );
  }
}

// Check transcription status via our backend server
async function checkTranscriptionStatusViaServer(transcriptId) {
  try {
    // Call your backend status check endpoint
    const response = await axios.get(
      `${TRANSCRIPTION_API_URL}/${transcriptId}`
    );
    console.log("Backend transcription status check:", response.data);
    return response.data; // Assumes backend returns the full status object
  } catch (error) {
    console.error("Backend status check error:", error);
    throw new Error(
      "Failed to check transcription status via backend. " +
        (error.response?.data?.error || error.message)
    );
  }
}

// Transcribe audio file using the backend proxy
export const transcribeWithAssemblyAI = async (file, onProgress) => {
  try {
    onProgress(10);

    // Step 1: Upload the file to our backend, which uploads to AssemblyAI
    const uploadedFileUrl = await uploadFileToServer(file, onProgress);

    // Step 2: Request transcription via our backend
    const transcriptId = await requestTranscriptionViaServer(
      uploadedFileUrl,
      onProgress
    );

    // Step 3: Poll backend for completion
    let attempts = 0;
    const maxAttempts = 60;
    onProgress(75);

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Use the backend checking function
      const checkResponse = await checkTranscriptionStatusViaServer(
        transcriptId
      );
      const status = checkResponse.status;

      const progressValue = 75 + (attempts / maxAttempts) * 20;
      onProgress(Math.min(95, progressValue));

      if (status === "completed") {
        onProgress(100);
        return checkResponse.text;
      } else if (status === "error") {
        throw new Error(
          `Transcription failed (via backend): ${
            checkResponse.error || "Unknown error"
          }`
        );
      }
      attempts++;
    }
    throw new Error("Transcription timed out (via backend)");
  } catch (error) {
    console.error("Transcription process error:", error);
    onProgress(0);
    throw error;
  }
};
