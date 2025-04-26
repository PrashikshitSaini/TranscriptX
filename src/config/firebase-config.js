// Firebase configuration from environment variables
// IMPORTANT: For Firebase client-side SDK, API key MUST be exposed via REACT_APP_ prefix in .env
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY, // Use the REACT_APP_ prefixed key
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate configuration - this helps catch common issues
const validateFirebaseConfig = () => {
  const requiredFields = [
    "apiKey", // Check for the REACT_APP_ prefixed key
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  // Check specifically if the apiKey (which needs the prefix) is missing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
    console.error(
      `Firebase config is missing required field: apiKey. Ensure 'REACT_APP_FIREBASE_API_KEY' is set in your .env file.`
    );
    return false;
  }

  // Check other fields
  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field] || firebaseConfig[field] === "undefined"
  );

  if (missingFields.length > 0) {
    console.error(
      `Firebase config is missing required fields: ${missingFields.join(
        ", "
      )}. Ensure all REACT_APP_FIREBASE_* variables are set in your .env file.`
    );
    return false;
  }

  return true;
};

// Run validation
const isConfigValid = validateFirebaseConfig();
if (!isConfigValid) {
  console.error(
    "Firebase configuration is invalid. Authentication will likely fail."
  );
}

export default firebaseConfig;
