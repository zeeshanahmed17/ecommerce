// Using a mock implementation instead of actual Firebase
// to avoid requiring real API keys

// Using dummy Firebase configuration for development
// This will allow the app to work without real Firebase credentials
const firebaseConfig = {
  apiKey: "dummy-api-key-for-development",
  authDomain: "dummy-project.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000:web:0000000000000000000000"
};

// We'll use a mock implementation instead of real Firebase
let app, auth, googleProvider;
setupMockFirebase();
console.log("Using mock Firebase implementation for development");

// Mock implementation for Firebase
function setupMockFirebase() {
  class MockAuth {
    currentUser = null;
    
    // Mock sign in with popup that always succeeds with dummy user data
    async signInWithPopup() {
      return {
        user: {
          uid: "mock-uid-123",
          email: "user@example.com",
          displayName: "Test User",
          photoURL: null
        }
      };
    }
    
    // Mock sign out function
    async signOut() {
      this.currentUser = null;
      return Promise.resolve();
    }
    
    // Mock auth state changed listener
    onAuthStateChanged(callback) {
      // Call with null to indicate signed out state
      setTimeout(() => callback(null), 0);
      // Return an unsubscribe function
      return () => {};
    }
  }

  class MockGoogleProvider {
    setCustomParameters(params) {
      // No-op implementation
    }
  }

  app = { name: "mock-app" };
  auth = new MockAuth();
  googleProvider = new MockGoogleProvider();
}

export { app, auth, googleProvider };