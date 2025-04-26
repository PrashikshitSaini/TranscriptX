import React, { useState, useEffect, useCallback, useMemo } from "react"; // Add useCallback
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
import PromptInput from "./components/PromptInput";
import UpgradeModal from "./components/UpgradeModal";
import NotesSidebar from "./components/NotesSidebar"; // Import Sidebar
import {
  saveNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "./services/notesService"; // Import notes service
import { Node } from "slate"; // Import Node from slate
import { extractTitleFromContent } from "./utils/textSanitizer";

// Main App Content
function AppContent() {
  const { currentUser, logout } = useAuth();
  const { usageCount, incrementUsage, loadingUsage } = useUsage();
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // Safe default note value
  const DEFAULT_NOTE_VALUE = useMemo(
    () => [{ type: "paragraph", children: [{ text: "" }] }],
    []
  );

  // Ensure generatedNotes always has a safe initial state
  const [generatedNotes, setGeneratedNotes] = useState(DEFAULT_NOTE_VALUE);

  // Add state for note saving
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState(
    "Create comprehensive, well-structured notes with headings, bullet points, and summaries."
  );
  const [usageCounted, setUsageCounted] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState("");
  const [currentAudioFingerprint, setCurrentAudioFingerprint] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // --- New State for Notes ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null); // ID of note in editor
  const [isLoadingNotes, setIsLoadingNotes] = useState(false); // Loading state for notes list
  const [isEditorLoading, setIsEditorLoading] = useState(false); // Loading state for editor content
  // --- End New State ---

  // Reset transcription when audio changes
  useEffect(() => {
    // Create a fingerprint of the current audio selection
    const newFingerprint = audioFile
      ? `file-${audioFile.name}-${audioFile.size}`
      : recordedAudio
      ? `recorded-${recordedAudio.size}-${new Date().getTime()}`
      : "";

    // If audio has changed, reset the transcription
    if (newFingerprint !== currentAudioFingerprint && newFingerprint !== "") {
      setCurrentTranscription("");
      setCurrentAudioFingerprint(newFingerprint);
      setUsageCounted(false);
      // Also clear the editor if audio changes, as it's no longer linked to a saved note
      setGeneratedNotes(null);
      setCurrentNoteId(null);
      setShowEditor(false);
    }
  }, [audioFile, recordedAudio, currentAudioFingerprint]); // Added dependencies

  // Fetch notes when component mounts and user exists
  useEffect(() => {
    if (currentUser) {
      fetchUserNotes();
    } else {
      setSavedNotes([]); // Clear notes on logout
      setCurrentNoteId(null);
      setGeneratedNotes(null);
      setShowEditor(false);
    }
  }, [currentUser]);

  const fetchUserNotes = async () => {
    if (!currentUser) return;
    setIsLoadingNotes(true);
    try {
      const userNotes = await getUserNotes(currentUser.uid);
      setSavedNotes(userNotes);
    } catch (err) {
      setError("Failed to load saved notes.");
      console.error(err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleFileSelected = (file) => {
    setAudioFile(file);
    setRecordedAudio(null);
  };

  const handleAudioRecorded = (audioBlob) => {
    setRecordedAudio(audioBlob);
    setAudioFile(null);
  };

  // Safely handle note generation with proper error handling
  const 
  handleGenerateNotes = async () => {
    let isAdmin = false;
    // Prevent usage if loading or limit reached (unless admin)
    if (!isAdmin && !loadingUsage && usageCount >= 20) {
      // Add !isAdmin condition
      setIsUpgradeModalOpen(true); // Open the modal instead of alert
      return;
    }

    // Ensure we have either a file or recorded audio
    if (!audioFile && !recordedAudio) {
      alert("Please record audio or upload a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Check if we already have a transcription for this audio
      let transcription = currentTranscription;
      let isNewTranscription = false;

      if (!transcription || transcription.trim() === "") {
        // Only transcribe if we don't already have a transcription for this audio
        isNewTranscription = true;

        if (audioFile) {
          // Transcribe the uploaded file
          transcription = await transcribeAudioFile(audioFile);
        } else if (recordedAudio) {
          // Transcribe the recorded audio
          transcription = await transcribeAudioFile(recordedAudio); // Assuming transcribeAudioFile handles blobs
        }

        if (!transcription || transcription.trim() === "") {
          throw new Error("Failed to transcribe audio");
        }
        // Save the transcription for future use
        setCurrentTranscription(transcription);
      }

      // Step 2: Generate notes from the transcription using the custom prompt
      const notes = await generateNotesFromTranscription(
        transcription,
        customPrompt
      );

      // Handle the result safely
      if (notes) {
        setGeneratedNotes(notes);
      } else {
        console.warn("Note generation returned null/undefined, using default");
        setGeneratedNotes(DEFAULT_NOTE_VALUE);
      }

      setShowEditor(true);
      setCurrentNoteId(null); // It's a new note, clear any existing ID

      // Only increment usage if this is a new transcription and not already counted
      // Also skip increment for admin user
      if (!isAdmin && isNewTranscription && !usageCounted) {
        // Add !isAdmin condition
        console.log("Incrementing usage count - new transcription");
        await incrementUsage();
        setUsageCounted(true);
      } else if (isAdmin) {
        console.log("Skipping usage count - Admin user.");
      } else {
        console.log("Skipping usage count - using cached transcription");
      }
    } catch (error) {
      console.error("Error during note generation:", error);
      setError(`Failed to generate notes: ${error.message}`);
      // Do NOT set generatedNotes to null here
    } finally {
      setIsProcessing(false);
    }
  };

  // Transcribe audio file using transcriptionService
  const transcribeAudioFile = async (audioSource) => {
    // Renamed param
    // Import the service dynamically to avoid circular dependencies
    const { transcribeWithAssemblyAI } = await import(
      "./services/transcriptionService"
    );

    return new Promise((resolve, reject) => {
      transcribeWithAssemblyAI(audioSource, (progress) => {
        // Use audioSource
        // Update progress if needed
      })
        .then((transcriptionText) => resolve(transcriptionText))
        .catch((err) => reject(err));
    });
  };

  // --- Notes Management Functions ---
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Safe note selection handler
  const handleNoteSelect = async (noteId) => {
    if (!noteId) {
      // User might have deleted the currently open note, or wants a blank slate
      setCurrentNoteId(null);
      setGeneratedNotes(DEFAULT_NOTE_VALUE); // Reset to default
      setShowEditor(false);
      return;
    }

    if (noteId === currentNoteId) return; // Already selected

    setIsEditorLoading(true);
    setShowEditor(true);

    try {
      const noteData = await getNoteById(noteId);

      if (noteData && noteData.content) {
        // Ensure content exists
        setCurrentNoteId(noteId);
        setGeneratedNotes(noteData.content); // Content should be sanitized by NotesEditor's deserialize
        // Clear transcription/audio context as we loaded a note
        setCurrentTranscription("");
        setAudioFile(null);
        setRecordedAudio(null);
        setCurrentAudioFingerprint(`note-${noteId}`);
      } else {
        setError("Could not load the selected note.");
        setCurrentNoteId(null);
        setGeneratedNotes(DEFAULT_NOTE_VALUE); // Use default value
        setShowEditor(false);
      }
    } catch (err) {
      setError("Failed to load note content.");
      console.error(err);
      setCurrentNoteId(null);
      setGeneratedNotes(DEFAULT_NOTE_VALUE); // Use default value on error
      setShowEditor(false);
    } finally {
      setIsEditorLoading(false);
    }
  };

  // Define the save note handler
  const handleSaveNote = async (editorContent) => {
    if (!currentUser) {
      setError("You must be logged in to save notes.");
      return;
    }
    if (
      !editorContent ||
      !Array.isArray(editorContent) ||
      editorContent.length === 0
    ) {
      setError("Cannot save empty note.");
      return;
    }

    setIsSavingNote(true);
    setError(null);

    // Use the utility function to extract title safely
    let title = extractTitleFromContent(editorContent, "Untitled Note");

    // Ensure title is not null or undefined
    if (!title || title.trim() === "") {
      title = "Untitled Note";
    }

    try {
      if (currentNoteId) {
        // Update existing note
        console.log(`Updating note ${currentNoteId} with title: ${title}`);
        await updateNote(currentNoteId, {
          content: editorContent,
          title: title,
          userId: currentUser.uid, // Explicitly include userId for validation
        });

        // Update local state
        setSavedNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === currentNoteId
              ? { ...note, title: title, content: editorContent }
              : note
          )
        );
        alert("Note updated successfully!");
      } else {
        // Save new note
        console.log(`Saving new note with title: ${title}`);
        const newNote = await saveNote(currentUser.uid, {
          content: editorContent,
          title: title,
          userId: currentUser.uid, // Explicitly include userId for validation
        });
        setSavedNotes((prevNotes) => [...prevNotes, newNote]);
        setCurrentNoteId(newNote.id);
        alert("Note saved successfully!");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      setError(`Failed to save note: ${err.message}`);
      alert(`Error saving note: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  // --- End Notes Management Functions ---

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* Pass toggle function to Header */}
      <Header
        currentUser={currentUser}
        onLogout={logout}
        onToggleSidebar={toggleSidebar}
      />

      {/* Render Sidebar */}
      <NotesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNoteSelect={handleNoteSelect}
        currentNoteId={currentNoteId}
        notes={savedNotes}
        setNotes={setSavedNotes} // Pass setter for updates within sidebar
        isLoadingNotes={isLoadingNotes}
        setIsLoadingNotes={setIsLoadingNotes}
      />

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
            disabled={
              (!audioFile && !recordedAudio) || isProcessing || isEditorLoading
            }
          >
            {isProcessing ? "Processing..." : "Generate New Notes"}
          </button>
          {currentTranscription && (
            <p className="transcription-info">
              Format changes won't count as new usage.
            </p>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="main-content">
          {showEditor ? (
            // Pass save handler and potentially loading state to editor
            <NotesEditor
              key={currentNoteId || "new-note"} // Force re-render when note changes
              initialValue={generatedNotes}
              onSaveRequest={handleSaveNote} // Pass the save handler
              isLoading={isEditorLoading || isSavingNote} // Combine loading states
              noteId={currentNoteId} // Pass current note ID
            />
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
              {currentTranscription && (
                <p className="ready-message">
                  ✓ Transcription already available
                </p>
              )}
              <p>Select a note from the menu (☰) or generate new notes.</p>
            </div>
          )}
        </div>
      </main>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
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
      "You are an AI assistant that receives audio/video transcriptions and converts them into well-structured notes. The notes must: Contain detailed information from the transcription, be organized with clear headings and structure, be comprehensive but avoid adding anything not in the transcription, and be in English regardless of the transcription language. When appropriate, format information as tables using markdown table syntax. For any mathematical concepts, use LaTeX syntax surrounded by $ for inline formulas or $$ for display formulas. Use rich formatting to improve readability.";

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
              content: `${customPrompt}\n\nHere is the transcription to use:\n\n${transcription}\n\nPlease format the notes effectively using markdown. When appropriate, create tables for structured data and use LaTeX notation for any mathematical formulas (use $inline formula$ or $$display formula$$). Include rich formatting to enhance readability.`,
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

      // Create structured Notion-like notes with proper spacing and rich formatting
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

## Example Table

| Feature | Description | Status |
|---------|-------------|--------|
| Tables | Displaying structured data | Supported |
| Math Formulas | Using LaTeX notation | Supported |
| Rich Text | Bold, italic, etc. | Supported |

## Mathematical Example

The relationship can be expressed as:

$$E = mc^2$$

Where $E$ represents energy, $m$ is mass, and $c$ is the speed of light in a vacuum.

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
