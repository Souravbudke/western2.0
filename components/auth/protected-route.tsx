"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  returnTo?: string; // URL to return to after sign in
}

export default function ProtectedRoute({ children, returnTo }: ProtectedRouteProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      // Redirect to sign-in page with return URL if provided
      const signInUrl = returnTo 
        ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`
        : "/sign-in";
      
      router.push(signInUrl);
      return;
    }
    
    setIsChecking(false);
  }, [user, isLoaded, router, returnTo]);

  // Show loading state while checking
  if (isChecking || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
}
