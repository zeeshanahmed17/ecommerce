// Firebase authentication module
// This is a placeholder to avoid errors when Firebase is not configured

// Create mock versions of Firebase objects to prevent runtime errors
class MockAuth {
  currentUser = null;
  onAuthStateChanged = (callback: Function) => {
    // Return an unsubscribe function
    return () => {};
  };
}

class MockGoogleProvider {
  setCustomParameters(params: any) {
    // Do nothing - this is a mock
    console.log("Mock: setCustomParameters called");
  }
}

// Export mock objects that match the Firebase interface but don't depend on Firebase
export const app = { name: "mock-app" };
export const auth = new MockAuth() as any;
export const googleProvider = new MockGoogleProvider() as any;

// Log warning about missing Firebase configuration
console.warn(
  "Firebase authentication is not configured. Please add the required environment variables."
);

/**
 * To properly configure Firebase, you need to:
 * 
 * 1. Add the following environment variables:
 *    - VITE_FIREBASE_API_KEY
 *    - VITE_FIREBASE_PROJECT_ID
 *    - VITE_FIREBASE_APP_ID
 * 
 * 2. Then replace this file with the proper Firebase implementation:
 * 
 * import { initializeApp } from "firebase/app";
 * import { getAuth, GoogleAuthProvider } from "firebase/auth";
 * 
 * const firebaseConfig = {
 *   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 *   authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
 *   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 *   storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
 *   appId: import.meta.env.VITE_FIREBASE_APP_ID,
 * };
 * 
 * export const app = initializeApp(firebaseConfig);
 * export const auth = getAuth(app);
 * export const googleProvider = new GoogleAuthProvider();
 * 
 * googleProvider.setCustomParameters({
 *   prompt: 'select_account'
 * });
 */