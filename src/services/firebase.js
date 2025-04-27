import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../config/firebase-config";

// Initialize Firebase with validated config
const app = initializeApp(firebaseConfig);

// Log initialization for debugging

// Initialize auth with explicit app reference
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with explicit app reference
export const db = getFirestore(app);

// Configure Google provider for better sign-in experience
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
