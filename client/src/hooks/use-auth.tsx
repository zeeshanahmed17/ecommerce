import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { auth as firebaseAuth, googleProvider as firebaseGoogleProvider } from "@/lib/firebase";
import { 
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  Auth,
  GoogleAuthProvider,
  User as FirebaseUser
} from "firebase/auth";

type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, "password">, Error, RegisterData>;
  signInWithGoogle: () => Promise<void>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = z.infer<typeof registerSchema>;

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  
  // Sync Firebase auth state with app
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth as Auth, (firebaseUser) => {
      setFirebaseLoaded(true);
      
      // If Firebase has a user but our app doesn't, try to authenticate with the server
      if (firebaseUser && !queryClient.getQueryData(["/api/user"])) {
        console.log("Firebase user exists but no session, attempting to restore session");
        // Get a token from Firebase
        firebaseUser.getIdToken()
          .then(token => {
            // Try to authenticate with the server using this token
            return apiRequest("POST", "/api/auth/token", { token });
          })
          .then(res => res.json())
          .then(userData => {
            queryClient.setQueryData(["/api/user"], userData);
          })
          .catch(error => {
            console.error("Failed to restore session:", error);
            // If server session failed, clean up Firebase to avoid inconsistent state
            firebaseSignOut(firebaseAuth as Auth).catch(e => console.error("Error signing out from Firebase:", e));
          });
      }
    });
    
    return () => unsubscribe();
  }, []);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, "password"> | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Don't run the query until Firebase has loaded to avoid race conditions
    enabled: firebaseLoaded,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      } catch (error: any) {
        console.error("Login error:", error);
        throw new Error(error.message || "Login failed. Please check your credentials.");
      }
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        return await res.json();
      } catch (error: any) {
        console.error("Registration error:", error);
        throw new Error(error.message || "Registration failed. Please try again later.");
      }
    },
    onSuccess: (user: Omit<User, "password">) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to ShopElite, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        // First, sign out from the backend
        const res = await apiRequest("POST", "/api/logout");
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Logout failed");
        }
        
        // Then sign out from Firebase if it's being used
        try {
          await firebaseSignOut(firebaseAuth as Auth);
        } catch (firebaseError: any) {
          console.error("Firebase logout error:", firebaseError);
          // Don't throw here, we still want to clear local state
        }
        
        // Clear the user data in React Query
        queryClient.setQueryData(["/api/user"], null);
      } catch (error: any) {
        console.error("Logout error:", error);
        throw new Error(error.message || "Logout failed. Please try again.");
      }
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Google Sign-in functionality
  const signInWithGoogle = async () => {
    try {
      // Show toast that we're processing
      toast({
        title: "Connecting to Google...",
        description: "Please wait while we connect to Google.",
      });
      
      console.log("Starting Google sign-in process");
      
      // Use Firebase Google authentication
      const result = await signInWithPopup(firebaseAuth as Auth, firebaseGoogleProvider as GoogleAuthProvider);
      
      console.log("Google sign-in completed successfully");
      
      const user = result.user;
      
      if (!user || !user.email) {
        throw new Error("Google sign-in didn't return required user information");
      }
      
      // Send the user data to our backend to create/update the user
      try {
        console.log("Sending user data to backend for authentication");
        
        const res = await apiRequest("POST", "/api/auth/google", {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Server authentication error:", errorData);
          throw new Error(errorData.message || "Server authentication failed");
        }
        
        const userData = await res.json();
        queryClient.setQueryData(["/api/user"], userData);
        
        toast({
          title: "Google sign-in successful",
          description: `Welcome, ${userData.fullName || userData.username}!`,
        });
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } catch (backendError: any) {
        console.error("Backend auth failed:", backendError);
        
        // Clean up Firebase auth state if server auth failed
        await firebaseSignOut(firebaseAuth as Auth);
        
        toast({
          title: "Authentication error",
          description: backendError.message || "Could not complete sign-in process with the server.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      // Check for FirebaseError which might have a specific code
      const errorCode = error.code ? error.code : 'unknown';
      const errorMessage = error.message || "An error occurred during Google sign-in";
      
      let userMessage = "Failed to sign in with Google. Please try again.";
      
      // Handle common error codes
      if (errorCode === 'auth/popup-closed-by-user') {
        userMessage = "Sign-in cancelled. You closed the Google sign-in window.";
      } else if (errorCode === 'auth/network-request-failed') {
        userMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorCode === 'auth/popup-blocked') {
        userMessage = "Pop-up blocked. Please allow pop-ups for this website and try again.";
      }
      
      toast({
        title: "Google Sign-In Error",
        description: userMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
