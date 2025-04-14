// Firebase configuration from environment variables (with no fallbacks)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate configuration - this helps catch common issues
const validateFirebaseConfig = () => {
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field] || firebaseConfig[field] === "undefined"
  );

  if (missingFields.length > 0) {
    console.error(
      `Firebase config is missing required fields: ${missingFields.join(", ")}`
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
