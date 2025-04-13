import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { auth, googleProvider } from "@/lib/firebase";
import { 
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut
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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, "password"> | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
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
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
      try {
        // Sign out from Firebase
        await firebaseSignOut(auth);
      } catch (error) {
        console.error("Error signing out from Firebase:", error);
        // Continue even if Firebase logout fails
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
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
      
      // Use Firebase Google authentication (mock implementation)
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      
      if (!user || !user.email) {
        throw new Error("Google sign-in didn't return required user information");
      }
      
      console.log("Google auth successful (mock), syncing with backend...");
      
      // Send the user data to our backend to create/update the user
      try {
        const res = await apiRequest("POST", "/api/auth/google", {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL
        });
        
        if (!res.ok) {
          const errorData = await res.json();
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
        toast({
          title: "Authentication error",
          description: "Could not complete sign-in process with the server.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Google sign-in failed",
        description: error.message || "An error occurred during Google sign-in",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        // The user is signed in with Firebase
        console.log("Firebase auth state changed: User signed in");
        // You could sync with backend here if needed
      } else {
        console.log("Firebase auth state changed: User signed out");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
