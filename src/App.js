import React, { useState } from "react";
import "./styles/App.css";
import Header from "./components/Header";
import AudioRecorder from "./components/AudioRecorder";
import FileUploader from "./components/FileUploader";
import TranscriptionDisplay from "./components/TranscriptionDisplay";
import NotesEditor from "./components/NotesEditor";

function App() {
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

  return (
    <div className="app">
      <Header />
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
            {isProcessing ? "Generating..." : "Generate Notes"}
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
    console.error("DeepSeek API key is missing. Check your .env file.");
    throw new Error(
      "API key is missing. Add REACT_APP_DEEPSEEK_API_KEY to your .env file"
    );
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
                "You are an AI assistant that creates well-structured, Notion-style notes from transcriptions. Format your response using proper markdown with consistent spacing. Include:\n\n1. Use # for main headings, ## for subheadings, and ### for tertiary headings\n2. Use blank lines between sections and paragraphs\n3. Format lists with proper indentation: use - for bullet points, 1. for numbered lists, and - [ ] or - [x] for task lists\n4. Use **bold** for key terms and important concepts\n5. Use > for blockquotes\n6. Maintain consistent hierarchy and organization\n\nEnsure proper spacing between headings, lists, and paragraphs to maintain readability.",
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

export default App;
