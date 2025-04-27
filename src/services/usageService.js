import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment as firestoreIncrement,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Retrieves the current usage count for a user
 * @param {string} userId - The Firebase user ID
 * @returns {Promise<number>} The current usage count
 */
export async function getUsageCount(userId) {
  if (!userId) {
    console.warn("Cannot get usage count: No user ID provided");
    return 0;
  }

  try {
    
    const ref = doc(db, "usage", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
     
      return data.count || 0;
    } else {
      console.log(`No existing usage data.`);
      try {
        await setDoc(ref, { count: 0, lastUpdated: new Date().toISOString() });
      } catch (error) {
        console.warn(
          "Could not create usage record - permissions issue:",
          error
        );
        // Return 0 even if we couldn't create the document due to permissions
      }
      return 0;
    }
  } catch (error) {
    console.error("Error getting usage count:", error);
    // If there's a permissions error, we'll just return 0 and track locally
    if (error.code === "permission-denied") {
      console.warn(
        "Permission denied for Firestore. Please update security rules."
      );
    }
    return 0;
  }
}

/**
 * Increments the usage count for a user
 * @param {string} userId - The Firebase user ID
 * @returns {Promise<boolean>} Success status
 */
export async function incrementUsageCount(userId) {
  if (!userId) {
    console.warn("Cannot increment usage: No user ID provided");
    return false;
  }

  try {
    
    const ref = doc(db, "usage", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      console.log("Updating existing usage record");
      await updateDoc(ref, {
        count: firestoreIncrement(1),
        lastUpdated: new Date().toISOString(),
      });
    } else {
      
      await setDoc(ref, {
        count: 1,
        lastUpdated: new Date().toISOString(),
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error incrementing usage count:", error);
    if (error.code === "permission-denied") {
      console.warn("Firebase permission denied - please check Firestore rules");
      console.warn(
        "You need to update your Firestore security rules to allow writing to the usage collection"
      );
      console.warn(
        "See Firebase console: https://console.firebase.google.com/project/transcriptx-d73b6/firestore/rules"
      );
    }
    return false;
  }
}
