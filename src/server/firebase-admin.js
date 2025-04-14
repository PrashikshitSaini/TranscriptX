// This file should only be used in Node.js environment (server-side)
const admin = require("firebase-admin");
const serviceAccount = require("../../credsTranscript.json");

let adminApp;
try {
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error("Firebase admin initialization error:", error);
}

const adminAuth = adminApp ? admin.auth(adminApp) : null;
const adminDb = adminApp ? admin.firestore(adminApp) : null;

module.exports = {
  adminAuth,
  adminDb,
};
