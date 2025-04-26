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
 * @param {object} noteData - The note data containing title and content
 * @returns {Promise<object>} The saved note
 */
export const saveNote = async (userId, noteData) => {
  if (!userId || typeof userId !== "string") {
    throw new Error("User ID, title, and content are required to save a note.");
  }

  // Ensure noteData object exists
  if (!noteData || typeof noteData !== "object") {
    throw new Error("Note data must be provided as an object.");
  }

  // Validate required fields
  const { title, content } = noteData;

  if (!title || typeof title !== "string" || title.trim() === "") {
    throw new Error("User ID, title, and content are required to save a note.");
  }

  if (!content || !Array.isArray(content) || content.length === 0) {
    throw new Error("User ID, title, and content are required to save a note.");
  }

  // If validation passes, continue with saving the note
  try {
    // Normalize noteData to ensure all required fields
    const normalizedNoteData = {
      ...noteData,
      title: title.trim(),
      userId, // Ensure userId is included
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
      ...normalizedNoteData,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp(),
    });
    // Remove console.log("Note saved successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving note:", error);
    throw error;
  }
};

/**
 * Updates an existing note.
 * @param {string} noteId - The ID of the note document.
 * @param {object} updates - An object containing fields to update (e.g., { title, content }).
 */
export async function updateNote(noteId, updates) {
  if (!noteId || !updates) {
    throw new Error("Note ID and updates are required.");
  }
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      ...updates,
      lastModified: serverTimestamp(),
    });
    // Remove console.log("Note updated successfully:", noteId);
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
    // Remove console.log(`Fetched ${notes.length} notes for user ${userId}`);
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
      // Remove console.log("Fetched note content for ID:", noteId);
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
    // Remove console.log("Note deleted successfully:", noteId);
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error("Could not delete note from Firestore.");
  }
}
