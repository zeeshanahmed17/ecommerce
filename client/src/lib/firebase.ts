import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "000000000000", // Required by Firebase SDK
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all required configuration is available
const hasValidConfig = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  import.meta.env.VITE_FIREBASE_APP_ID;

let app, auth, googleProvider;

// Initialize Firebase
try {
  // Check if Firebase was already initialized to avoid duplicate app error
  const apps = getApps();
  app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (!hasValidConfig) {
    throw new Error("Firebase configuration is incomplete");
  }
  
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