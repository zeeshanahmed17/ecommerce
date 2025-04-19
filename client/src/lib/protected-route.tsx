import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "../hooks/use-toast";
import { useEffect, ReactNode } from "react";

type ProtectedRouteProps = {
  path: string;
  component?: () => React.JSX.Element;
  children?: ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({
  path,
  component: Component,
  children,
  adminOnly = false
}: ProtectedRouteProps) {
  const { user, isLoading, error } = useAuth();
  const { toast } = useToast();

  // Handle authentication errors
  useEffect(() => {
    if (error) {
      console.error("Auth error in protected route:", error);
      toast({
        title: "Authentication Error",
        description: "Please try logging in again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check admin permissions
  if (adminOnly && !user.isAdmin) {
    console.log("Access denied: User is not an admin");
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-center mb-6">You don't have permission to access this page.</p>
          <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
        </div>
      </Route>
    );
  }

  // Return either the component or children
  return (
    <Route path={path}>
      {Component ? <Component /> : children}
    </Route>
  );
}
