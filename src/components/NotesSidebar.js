import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaEdit, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { getUserNotes, updateNote, deleteNote } from "../services/notesService";

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: ${(props) => (props.isOpen ? "0" : "-300px")};
  width: 300px;
  height: 100%;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 60px 0 20px; /* Add padding top for header */
  transition: left 0.3s ease-in-out;
  z-index: 1001; /* Ensure sidebar is above content but below header potentially */
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }
`;

const SidebarHeader = styled.h3`
  padding: 0 20px 10px;
  margin: 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
`;

const NotesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
`;

const NoteItem = styled.li`
  padding: 12px 20px;
  border-bottom: 1px solid var(--bg-tertiary);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${(props) =>
    props.isActive ? "var(--accent-color-light)" : "transparent"};

  &:hover {
    background-color: var(--bg-tertiary);
  }
`;

const NoteTitle = styled.span`
  flex-grow: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoteActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;

    &:hover {
      color: var(--accent-color);
    }
  }
`;

const EditInput = styled.input`
  flex-grow: 1;
  padding: 4px 8px;
  border: 1px solid var(--accent-color);
  border-radius: 4px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  margin-right: 5px;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
`;

function NotesSidebar({
  isOpen,
  onClose,
  onNoteSelect,
  currentNoteId,
  notes,
  setNotes,
  isLoadingNotes,
  setIsLoadingNotes,
}) {
  const { currentUser } = useAuth();
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (currentUser && isOpen) {
      fetchNotes();
    }
  }, [currentUser, isOpen]); // Refetch when sidebar opens or user changes

  const fetchNotes = async () => {
    if (!currentUser) return;
    setIsLoadingNotes(true);
    try {
      const userNotes = await getUserNotes(currentUser.uid);
      setNotes(userNotes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      // Handle error display if needed
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSelect = (noteId) => {
    onNoteSelect(noteId);
    // Optionally close sidebar on selection: onClose();
  };

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (noteId) => {
    if (!editingTitle.trim()) {
      alert("Note title cannot be empty.");
      return;
    }
    try {
      await updateNote(noteId, { title: editingTitle.trim() });
      // Update local state immediately
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === noteId ? { ...n, title: editingTitle.trim() } : n
        )
      );
      setEditingNoteId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to rename note:", error);
      alert("Failed to rename note. Please try again.");
    }
  };

  const handleDelete = async (noteId, noteTitle) => {
    if (window.confirm(`Are you sure you want to delete "${noteTitle}"?`)) {
      try {
        await deleteNote(noteId);
        // Update local state immediately
        setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
        // If the deleted note was the currently loaded one, inform parent
        if (noteId === currentNoteId) {
          onNoteSelect(null); // Signal to clear the editor
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={onClose} title="Close Sidebar">
        <FaTimes />
      </CloseButton>
      <SidebarHeader>My Notes</SidebarHeader>
      {isLoadingNotes ? (
        <LoadingMessage>Loading notes...</LoadingMessage>
      ) : (
        <NotesList>
          {notes.length === 0 ? (
            <LoadingMessage>No saved notes yet.</LoadingMessage>
          ) : (
            notes.map((note) => (
              <NoteItem key={note.id} isActive={note.id === currentNoteId}>
                {editingNoteId === note.id ? (
                  <>
                    <EditInput
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveEdit(note.id)
                      }
                      onBlur={() => setTimeout(handleCancelEdit, 150)} // Delay blur slightly
                    />
                    <NoteActions>
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        title="Save Title"
                      >
                        <FaSave />
                      </button>
                    </NoteActions>
                  </>
                ) : (
                  <>
                    <NoteTitle onClick={() => handleSelect(note.id)}>
                      {note.title || "Untitled Note"}{" "}
                      {/* Add fallback for null titles */}
                    </NoteTitle>
                    <NoteActions>
                      <button
                        onClick={() => handleEdit(note)}
                        title="Rename Note"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(note.id, note.title || "Untitled Note")
                        }
                        title="Delete Note"
                      >
                        <FaTrash />
                      </button>
                    </NoteActions>
                  </>
                )}
              </NoteItem>
            ))
          )}
        </NotesList>
      )}
    </SidebarContainer>
  );
}

export default NotesSidebar;
