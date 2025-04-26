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
import { extractTitleFromContent } from "./utils/textSanitizer"; // Keep this, but it will be modified

import axios from "axios"; // Import axios

// Default empty state for TipTap (HTML)
const DEFAULT_NOTE_VALUE = "";

// Main App Content
function AppContent() {
  const { currentUser, logout } = useAuth();
  const { usageCount, incrementUsage, loadingUsage } = useUsage();
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  // Safe default note value
  const [generatedNotes, setGeneratedNotes] = useState(DEFAULT_NOTE_VALUE); // Use new default

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
  const handleGenerateNotes = async () => {
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
        // Remove console.log("Incrementing usage count - new transcription");
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

      if (noteData) {
        // Pass the raw content (could be old Slate JSON or new HTML)
        // The NotesEditor's deserialize logic will handle conversion
        setCurrentNoteId(noteId);
        // Ensure content is not null/undefined before setting
        setGeneratedNotes(noteData.content || DEFAULT_NOTE_VALUE);
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
  // Now expects editorContent to be HTML string from TipTap
  const handleSaveNote = async (editorContent) => {
    if (!currentUser) {
      setError("You must be logged in to save notes.");
      return;
    }
    // Basic check for empty content (might need refinement for empty HTML like '<p></p>')
    if (
      !editorContent ||
      editorContent === "<p></p>" ||
      editorContent.trim() === ""
    ) {
      setError("Cannot save empty note.");
      return;
    }

    setIsSavingNote(true);
    setError(null);

    // Use the updated utility function to extract title from HTML content
    let title = extractTitleFromContent(editorContent, "Untitled Note");

    // Ensure title is not null or undefined
    if (!title || title.trim() === "") {
      title = "Untitled Note";
    }

    try {
      const noteData = {
        content: editorContent, // Save HTML content
        title: title,
        userId: currentUser.uid,
      };

      if (currentNoteId) {
        // Update existing note
        await updateNote(currentNoteId, noteData);

        // Update local state
        setSavedNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === currentNoteId ? { ...note, ...noteData } : note
          )
        );
        alert("Note updated successfully!");
      } else {
        // Save new note
        const newNote = await saveNote(currentUser.uid, noteData);
        setSavedNotes((prevNotes) => [...prevNotes, newNote]);
        setCurrentNoteId(newNote.id);
        // Optionally update the editor content state if needed, though TipTap manages its state internally
        // setGeneratedNotes(editorContent);
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
              initialValue={generatedNotes} // Pass HTML string or potentially old Slate JSON
              onSaveRequest={handleSaveNote} // Expects HTML string back
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

// Updated implementation that uses backend proxy for DeepSeek API
async function generateNotesFromTranscription(transcription, customPrompt) {
  try {
    // Call our backend endpoint instead of DeepSeek directly
    const response = await axios.post("/api/generate-notes", {
      transcription,
      customPrompt,
    });

    // If we have notes in the response, return them
    if (response.data && response.data.notes) {
      return response.data.notes;
    }

    // Fall back to local generation if needed
    throw new Error("Failed to get notes from server");
  } catch (error) {
    console.error("Error generating notes:", error);

    // Create fallback notes
    console.warn("Using fallback notes generation due to API error");

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
