import React, { useState, useRef, useEffect } from "react";
import NotesEditor from "./NotesEditor";

/**
 * A wrapper component that stabilizes the NotesEditor mounting behavior
 * to prevent React hook count errors when switching between content types.
 */
function EditorWrapper(props) {
  const {
    isLoading,
    generatedNotes,
    selectedNoteId,
    selectedNoteContent,
    selectedNoteTitle,
    onNoteSaved,
  } = props;

  // Use refs to avoid remounting component when props change
  const editorRef = useRef(null);

  // Determine what content to display
  const editorContent = selectedNoteId ? selectedNoteContent : generatedNotes;

  if (isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          color: "var(--text-secondary)",
        }}
      >
        Loading note...
      </div>
    );
  }

  if (!editorContent) {
    return (
      <div className="placeholder-container">
        <h2>TranscriptX</h2>
        <p>
          Record or upload your audio and click "Generate Notes" to create
          well-structured notes.
        </p>
        {props.hasAudio && !props.hasTranscription && (
          <p className="ready-message">✓ Audio ready for processing</p>
        )}
        {props.hasTranscription && (
          <p className="ready-message">
            ✓ Transcription available. Generate notes now.
          </p>
        )}
      </div>
    );
  }

  // Always use a stable key to prevent component remounting
  return (
    <NotesEditor
      key="stable-editor-instance"
      initialContent={editorContent}
      noteId={selectedNoteId}
      noteTitle={selectedNoteTitle}
      onNoteSaved={onNoteSaved}
      ref={editorRef}
    />
  );
}

export default EditorWrapper;
