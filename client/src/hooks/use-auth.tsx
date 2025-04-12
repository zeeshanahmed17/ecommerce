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

// Mock Firebase auth functions since we're using placeholder Firebase
const mockFirebaseFunctions = {
  signInWithPopup: async () => ({ 
    user: { 
      uid: 'mock-uid', 
      email: 'user@example.com', 
      displayName: 'Demo User', 
      photoURL: null 
    } 
  }),
  onAuthStateChanged: (auth: any, callback: Function) => {
    // Return unsubscribe function
    return () => {};
  },
  signOut: async () => {}
};

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
        // Use mock function to avoid dependency on Firebase
        await mockFirebaseFunctions.signOut();
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
      // Use mock function to avoid dependency on Firebase
      const result = await mockFirebaseFunctions.signInWithPopup();
      const user = result.user;
      
      // Show info about missing Firebase configuration
      toast({
        title: "Firebase not configured",
        description: "Using mock authentication. Add Firebase keys to enable Google sign-in.",
      });
      
      // Attempt to use local authentication instead
      try {
        // Use demo credentials to login
        const res = await apiRequest("POST", "/api/login", {
          username: "demo",
          password: "password",
        });
        const userData = await res.json();
        queryClient.setQueryData(["/api/user"], userData);
      } catch (localError) {
        console.error("Fallback local auth failed:", localError);
      }
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Use mock function to avoid dependency on Firebase
    const unsubscribe = mockFirebaseFunctions.onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        // Mock implementation - do nothing
        console.log("Mock Firebase auth state changed");
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
