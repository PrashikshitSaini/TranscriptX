import React, { useContext, useState, useEffect, createContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
} from "firebase/auth";
// Import firebase services after firebase/auth imports
import { auth, googleProvider } from "../services/firebase";

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper function to handle auth errors
  const handleAuthError = (error) => {
    console.error("Authentication error:", error);

    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      "auth/user-not-found": "No account found with this email address",
      "auth/wrong-password": "Incorrect password",
      "auth/email-already-in-use": "Email already in use",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/invalid-email": "Invalid email format",
      "auth/account-exists-with-different-credential":
        "Account already exists with a different sign-in method",
      "auth/popup-closed-by-user": "Sign-in was cancelled",
      "auth/network-request-failed":
        "Network error. Please check your connection",
      "auth/too-many-requests":
        "Too many failed login attempts. Please try again later",
    };

    const errorMessage =
      errorMessages[error.code] || `Authentication failed: ${error.message}`;
    setError(errorMessage);
    return errorMessage;
  };

  // Clear previous errors
  const clearError = () => {
    setError("");
  };

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      clearError();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Send email verification
      await sendEmailVerification(userCredential.user);

      return userCredential.user;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      clearError();
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Login with Google
  async function signInWithGoogle() {
    try {
      clearError();
      googleProvider.addScope("profile");
      googleProvider.addScope("email");
      const result = await signInWithPopup(auth, googleProvider);

      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      // The signed-in user info
      const user = result.user;
      return { user, token };
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      clearError();
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Update user profile
  async function updateUserProfile(profile) {
    try {
      clearError();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, profile);
        // Force refresh the user to get latest profile data
        setCurrentUser({ ...auth.currentUser });
      } else {
        throw new Error("No user is signed in");
      }
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Logout
  async function logout() {
    try {
      clearError();
      await signOut(auth);
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Provide value to context
  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    updateUserProfile,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
