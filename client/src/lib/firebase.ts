import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Since we can't directly access the Firebase secrets in client code,
// we'll assume they are available and let the Firebase SDK handle errors
const hasFirebaseConfig = true;

// Fallback values for development environments
let apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key";
let projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project";
let appId = import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id";

// Create Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth, googleProvider;

if (hasFirebaseConfig) {
  try {
    // Initialize Firebase with provided configuration
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log("Firebase authentication initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    setupMockFirebase();
  }
} else {
  console.warn(
    "Firebase configuration incomplete. Using mock implementation."
  );
  setupMockFirebase();
}

// Fallback to mock implementation if Firebase initialization fails
function setupMockFirebase() {
  class MockAuth {
    currentUser = null;
    onAuthStateChanged = (callback) => {
      // Return an unsubscribe function
      return () => {};
    };
  }

  class MockGoogleProvider {
    setCustomParameters(params) {
      // Mock implementation
    }
  }

  app = { name: "mock-app" };
  auth = new MockAuth();
  googleProvider = new MockGoogleProvider();
}

export { app, auth, googleProvider };