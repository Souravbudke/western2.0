"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check if user has admin role in metadata
    const userRole = user.publicMetadata.role as string | undefined;
    if (userRole === "admin") {
      setIsAdmin(true);
    } else {
      // Redirect non-admin users to home page
      router.push("/store");
    }
    
    setIsChecking(false);
  }, [user, isLoaded, router]);

  // Show loading state while checking
  if (isChecking || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is admin
  return isAdmin ? <>{children}</> : null;
}
