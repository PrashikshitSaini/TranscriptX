import React, { useState } from "react";
import "./styles/App.css";
import Header from "./components/Header";
import AudioRecorder from "./components/AudioRecorder";
import FileUploader from "./components/FileUploader";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import NotesEditor from "./components/NotesEditor";
import Login from "./components/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Main App Content
function AppContent() {
  const { currentUser, logout } = useAuth();
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);

  const handleTranscriptionUpdate = (text) => {
    setTranscription(text);
  };

  const handleGenerateNotes = async () => {
    if (!transcription.trim()) {
      alert("Please record or upload audio to generate transcription first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Use the actual API call to DeepSeek
      const notes = await generateNotesFromTranscription(transcription);

      // Check if notes were properly generated
      if (!notes || notes.trim() === "") {
        throw new Error("Failed to generate notes from the API");
      }

      setGeneratedNotes(notes);
      setShowEditor(true);
    } catch (error) {
      console.error("Error generating notes:", error);
      setError(`Failed to generate notes: ${error.message}`);
      alert(`Failed to generate notes: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
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
          <AudioRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onTranscriptionUpdate={handleTranscriptionUpdate}
          />
          <FileUploader
            onTranscriptionComplete={setTranscription}
            setIsProcessing={setIsProcessing}
          />
          <button
            className="generate-btn"
            onClick={handleGenerateNotes}
            disabled={!transcription.trim() || isProcessing}
          >
            {isProcessing
              ? "Generating..."
              : "Generate Notes(refresh for new notes)"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="main-content">
          <TranscriptionDisplay
            transcription={transcription}
            isRecording={isRecording}
          />
          {showEditor && <NotesEditor initialValue={generatedNotes} />}
        </div>
      </main>
    </div>
  );
}

// Actual implementation of the DeepSeek API
async function generateNotesFromTranscription(transcription) {
  // Get the API key from environment variable
  const API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY;

  if (!API_KEY) {
    console.error("Model is missing");
    throw new Error("Model is missing");
  }

  try {
    console.log("Calling DeepSeek API...");

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
              content:
                "You are an AI assistant that creates well-structured, Notion-style/markdown notes from transcriptions with good headings and bullet points wherever relevant. But don't mention this in the result just give the formatted result. Also give the notes in detail without anything from your side and keeping in the limits of the transcription.NOTE: Even if the transcription is in hindi or a mix of languages,you have make the notes only in English",
            },
            {
              role: "user",
              content: `Generate well-formatted Notion-style notes from this transcription. Use proper markdown with consistent spacing between sections:\n\n${transcription}`,
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

// Main App wrapped with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
