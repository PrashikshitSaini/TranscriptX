import React, { useState, useEffect } from "react";
import "./styles/App.css";
import Header from "./components/Header";
import AudioRecorder from "./components/AudioRecorder";
import FileUploader from "./components/FileUploader";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import NotesEditor from "./components/NotesEditor";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UsageProvider, useUsage } from "./contexts/UsageContext";
import UsageIndicator from "./components/UsageIndicator";
import PromptInput from "./components/PromptInput"; // New import for the prompt input

// Main App Content
function AppContent() {
  const { currentUser, logout } = useAuth();
  const { usageCount, incrementUsage, loadingUsage } = useUsage();
  const [audioFile, setAudioFile] = useState(null); // Store audio file or recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null); // Store recorded audio
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState(
    "Create comprehensive, well-structured notes with headings, bullet points, and summaries."
  );
  // Track if usage was counted for current session
  const [usageCounted, setUsageCounted] = useState(false);

  // Reset usage counted flag when audio changes
  useEffect(() => {
    setUsageCounted(false);
  }, [audioFile, recordedAudio]);

  const handleFileSelected = (file) => {
    setAudioFile(file);
    setRecordedAudio(null); // Clear any recorded audio when a file is uploaded
  };

  const handleAudioRecorded = (audioBlob) => {
    setRecordedAudio(audioBlob);
    setAudioFile(null); // Clear any uploaded file when audio is recorded
  };

  const handleGenerateNotes = async () => {
    // Prevent usage if loading or limit reached
    if (!loadingUsage && usageCount >= 20) {
      alert(
        "You have reached the maximum usage limit of 20. Please upgrade your plan or try again later."
      );
      return;
    }

    // Ensure we have either a file or recorded audio
    if (!audioFile && !recordedAudio) {
      alert("Please record audio or upload a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setShowEditor(false);

    try {
      // Step 1: Transcribe the audio (file or recording)
      let transcription;
      if (audioFile) {
        // Transcribe the uploaded file
        transcription = await transcribeAudioFile(audioFile);
      } else if (recordedAudio) {
        // Transcribe the recorded audio
        transcription = await transcribeAudioFile(recordedAudio);
      }

      if (!transcription || transcription.trim() === "") {
        throw new Error("Failed to transcribe audio");
      }

      // Step 2: Generate notes from the transcription using the custom prompt
      const notes = await generateNotesFromTranscription(
        transcription,
        customPrompt
      );

      // Check if notes were properly generated
      if (!notes || notes.trim() === "") {
        throw new Error("Failed to generate notes from the API");
      }

      setGeneratedNotes(notes);
      setShowEditor(true);

      // Only increment usage if not already counted for this session
      if (!usageCounted) {
        console.log("Incrementing usage count - successful generation");
        await incrementUsage();
        setUsageCounted(true);
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      setError(`Failed to generate notes: ${error.message}`);
      alert(`Failed to generate notes: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Transcribe audio file using transcriptionService
  const transcribeAudioFile = async (audioFile) => {
    // Import the service dynamically to avoid circular dependencies
    const { transcribeWithAssemblyAI } = await import(
      "./services/transcriptionService"
    );

    return new Promise((resolve, reject) => {
      transcribeWithAssemblyAI(audioFile, (progress) => {
        // Update progress if needed
      })
        .then((transcriptionText) => resolve(transcriptionText))
        .catch((err) => reject(err));
    });
  };

  // If not logged in, show login screen
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app">
      <Header currentUser={currentUser} onLogout={logout} />
      <main className="content">
        <div className="sidebar">
          <UsageIndicator />
          <AudioRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onAudioRecorded={handleAudioRecorded}
          />
          <FileUploader
            onFileSelected={handleFileSelected}
            setIsProcessing={setIsProcessing}
          />
          <PromptInput
            value={customPrompt}
            onChange={setCustomPrompt}
            disabled={isProcessing}
          />
          <button
            className="generate-btn"
            onClick={handleGenerateNotes}
            disabled={(!audioFile && !recordedAudio) || isProcessing}
          >
            {isProcessing ? "Processing..." : "Generate Notes"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="main-content">
          {showEditor ? (
            <NotesEditor initialValue={generatedNotes} />
          ) : (
            <div className="placeholder-container">
              <h2>TranscriptX</h2>
              <p>
                Record or upload your audio and click "Generate Notes" to create
                well-structured notes.
              </p>
              {(audioFile || recordedAudio) && (
                <p className="ready-message">✓ Audio ready for processing</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Actual implementation of the DeepSeek API
async function generateNotesFromTranscription(transcription, customPrompt) {
  // Get the API key from environment variable
  const API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY;

  if (!API_KEY) {
    console.error("Model is missing");
    throw new Error("Model is missing");
  }

  try {
    console.log("Calling DeepSeek API...");

    const systemPrompt =
      "You are an AI assistant that receives audio/video transcriptions and converts them into well-structured notes. The notes must: Contain detailed information from the transcription, be organized with clear headings and structure, be comprehensive but avoid adding anything not in the transcription, and be in English regardless of the transcription language.";

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `${customPrompt}\n\nHere is the transcription to use:\n\n${transcription}`,
            },
          ],
        }),
      }
    );

    // Log the response status for debugging
    console.log("DeepSeek API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API error details:", errorData);
      throw new Error(
        `API request failed with status ${response.status}: ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    console.log("DeepSeek API response:", data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from API");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);

    // If we can't connect to the API, provide a notion-style fallback for testing
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network")
    ) {
      console.warn("Using fallback notes generation due to network error");

      // Create structured Notion-like notes with proper spacing
      const fallbackNotes = `# Notes from Transcription

## Key Points

- ${transcription.split(".")[0]}.
- The main subject discussed is about ${
        transcription.substring(0, 30).toLowerCase().includes("the")
          ? transcription.substring(
              transcription.toLowerCase().indexOf("the") + 4,
              transcription.toLowerCase().indexOf("the") + 20
            )
          : "the topic"
      }.
- There are important concepts mentioned in the text.

## Summary

${transcription.substring(0, 150)}...

## Details

${
  transcription.length > 150
    ? transcription.substring(150, 300) + "..."
    : "No additional details available."
}

## Action Items

- [ ] Review these notes
- [ ] Follow up on key points
- [x] Generate initial draft
- [ ] Research more about the topic

> Note: This is a fallback version generated locally due to API connectivity issues.`;

      return fallbackNotes;
    }

    throw error;
  }
}

// Main App wrapped with AuthProvider and UsageProvider
function App() {
  return (
    <AuthProvider>
      <UsageProvider>
        <AppContent />
      </UsageProvider>
    </AuthProvider>
  );
}

export default App;
