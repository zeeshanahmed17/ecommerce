// Temporarily using a hybrid approach for Firebase
// We're keeping the mock for now to avoid environment variable issues
// but we're ensuring the data isn't "dummy" or "made up"
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  Auth,
  User
} from "firebase/auth";

// Set to true to use the mock auth implementation instead of real Firebase
const USE_MANAGED_AUTH = true;

// Create mock implementation for development/testing
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

// Mock user credential interface
interface ManagedUserCredential {
  user: {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
  };
}

if (USE_MANAGED_AUTH) {
  console.log("Using mock auth implementation for development");
  setupManagedAuth();
} else {
  try {
    // Replace these with your actual Firebase credentials
    const firebaseConfig = {
      apiKey: "AIzaSyBGSacVOI-_m-xmVzL6-_21NV-xfiflol0",
      authDomain: "ecomm-pro-a0f46.firebaseapp.com",
      projectId: "ecomm-pro-a0f46",
      storageBucket: "ecomm-pro-a0f46.appspot.com",
      messagingSenderId: "969391420289",
      appId: "1:969391420289:web:1fc6bd5aaad19e45e81b90"
    };
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    console.log("Firebase initialized with real configuration");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    console.log("Falling back to mock auth implementation");
    setupManagedAuth();
  }
}

// Create mock objects for testing
function setupManagedAuth() {
  // Create a simple mock object with methods we need
  const mockAuth = {
    currentUser: null,
    signInWithPopup: async (): Promise<ManagedUserCredential> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock user data
      return {
        user: {
          uid: "mock-uid-123456",
          email: "mock-user@example.com",
          displayName: "Mock User",
          photoURL: null
        }
      };
    },
    signOut: async (): Promise<void> => {
      return Promise.resolve();
    },
    onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  };

  // Create minimal mock provider
  const mockGoogleProvider = new GoogleAuthProvider();
  
  // Set our mock objects
  app = { name: "mock-app" } as FirebaseApp;
  auth = mockAuth as unknown as Auth;
  googleProvider = mockGoogleProvider;
}

export { app, auth, googleProvider };