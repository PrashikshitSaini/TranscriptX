import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const NOTES_COLLECTION = "userNotes";

/**
 * Save a new note
 * @param {string} userId - The user ID
 * @param {object} noteData - The note data containing title and content (HTML string)
 * @returns {Promise<string>} The ID of the saved note
 */
export const saveNote = async (userId, noteData) => {
  if (!userId || typeof userId !== "string") {
    // Keep User ID validation
    throw new Error("User ID is required to save a note.");
  }

  // Ensure noteData object exists
  if (!noteData || typeof noteData !== "object") {
    throw new Error("Note data must be provided as an object.");
  }

  // Validate required fields (title and content as string)
  const { title, content } = noteData;

  if (!title || typeof title !== "string" || title.trim() === "") {
    // Keep title validation
    throw new Error("Note title is required.");
  }

  // --- Updated Content Validation ---
  // Check if content is a non-empty string
  if (
    !content ||
    typeof content !== "string" ||
    content.trim() === "" ||
    content.trim() === "<p></p>"
  ) {
    throw new Error("Note content cannot be empty.");
  }
  // --- End Updated Content Validation ---

  // If validation passes, continue with saving the note
  try {
    // Normalize noteData to ensure all required fields
    const normalizedNoteData = {
      title: title.trim(),
      content: content, // Store the HTML string
      userId, // Ensure userId is included
      // Remove createdAt: new Date().toISOString(), // Use serverTimestamp instead
    };

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
      ...normalizedNoteData,
      createdAt: serverTimestamp(), // Use server timestamp for creation
      lastModified: serverTimestamp(), // Use server timestamp for modification
    });
    // Return the ID of the newly created document
    return { id: docRef.id, ...normalizedNoteData }; // Return the full note object including ID
  } catch (error) {
    console.error("Error saving note:", error);
    // Re-throw a more specific error or the original one
    throw new Error(`Could not save note: ${error.message}`);
  }
};

/**
 * Updates an existing note.
 * @param {string} noteId - The ID of the note document.
 * @param {object} updatedData - An object containing fields to update (e.g., { title: "New Title", content: "<p>New content</p>" })
 */
export async function updateNote(noteId, updatedData) {
  if (!noteId) {
    throw new Error("Note ID is required to update.");
  }
  if (
    !updatedData ||
    typeof updatedData !== "object" ||
    Object.keys(updatedData).length === 0
  ) {
    throw new Error("Update data must be provided as a non-empty object.");
  }

  // --- Optional: Validate content if present in updatedData ---
  if (updatedData.content !== undefined) {
    if (
      typeof updatedData.content !== "string" ||
      updatedData.content.trim() === "" ||
      updatedData.content.trim() === "<p></p>"
    ) {
      throw new Error("Note content cannot be empty.");
    }
  }
  // --- End Content Validation ---

  // --- Optional: Validate title if present ---
  if (updatedData.title !== undefined) {
    if (
      typeof updatedData.title !== "string" ||
      updatedData.title.trim() === ""
    ) {
      throw new Error("Note title cannot be empty.");
    }
    // Trim title if updating
    updatedData.title = updatedData.title.trim();
  }
  // --- End Title Validation ---

  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      ...updatedData,
      lastModified: serverTimestamp(), // Update the last modified timestamp
    });
    
  } catch (error) {
    console.error("Error updating note:", error);
    throw new Error("Could not update note in Firestore.");
  }
}

/**
 * Fetches all notes for a specific user, ordered by last modified date.
 * @param {string} userId - The Firebase user ID.
 * @returns {Promise<Array<{id: string, title: string, lastModified: Date}>>} A list of note metadata.
 */
export async function getUserNotes(userId) {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where("userId", "==", userId),
      orderBy("lastModified", "desc")
    );
    const querySnapshot = await getDocs(q);
    const notes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to JS Date if needed, otherwise keep as is
      lastModified: doc.data().lastModified?.toDate
        ? doc.data().lastModified.toDate()
        : null,
      createdAt: doc.data().createdAt?.toDate
        ? doc.data().createdAt.toDate()
        : null,
    }));
    
    return notes;
  } catch (error) {
    console.error("Error fetching user notes:", error);
    throw new Error("Could not fetch user notes.");
  }
}

/**
 * Fetches the full content of a specific note by its ID.
 * @param {string} noteId - The ID of the note document.
 * @returns {Promise<object|null>} The full note data including content, or null if not found.
 */
export async function getNoteById(noteId) {
  if (!noteId) return null;
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const docSnap = await getDoc(noteRef);
    if (docSnap.exists()) {
      
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn("No note found with ID:", noteId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching note by ID:", error);
    throw new Error("Could not fetch note content.");
  }
}

/**
 * Deletes a note.
 * @param {string} noteId - The ID of the note document to delete.
 */
export async function deleteNote(noteId) {
  if (!noteId) {
    throw new Error("Note ID is required to delete.");
  }
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await deleteDoc(noteRef);
    
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error("Could not delete note from Firestore.");
  }
}
