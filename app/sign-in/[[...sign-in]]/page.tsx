"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode on component mount and when it changes
  useEffect(() => {
    // Check initial preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-purple-50 to-red-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 lg:px-8 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">
            WesternStreet sneakers
          </h1>
          <p className="text-gray-600 mt-2 dark:text-gray-300">Sign in to your account</p>
        </div>
        <SignIn
          appearance={{
            // Apply different appearance based on dark mode
            ...(isDarkMode ? {
              variables: {
                colorPrimary: "#ec4899",
                colorText: "#f9fafb",
                colorTextSecondary: "#d1d5db",
                colorBackground: "#1f2937",
                colorInputBackground: "#374151",
                colorInputText: "#f9fafb",
                colorDanger: "#ef4444"
              },
              elements: {
                rootBox: "mx-auto",
                card: "mx-auto bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 border border-gray-700",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-gray-700 hover:bg-gray-600 text-white",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-gray-600",
                dividerText: "text-gray-400",
                formButtonPrimary: "bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white",
                footerActionText: "text-gray-400",
                footerActionLink: "text-red-400 hover:text-red-300",
                formFieldInput: "border-gray-600 bg-gray-700 text-white focus:border-red-500 focus:ring-red-500",
                formFieldLabel: "text-gray-300",
                formFieldErrorText: "text-red-400",
                identityPreviewText: "text-gray-300",
                identityPreviewEditButton: "text-gray-400 hover:text-white",
              }
            } : {
              // Light mode styling
              elements: {
                rootBox: "mx-auto",
                card: "mx-auto bg-white rounded-xl shadow-md p-6 sm:p-8 border border-gray-200",
                formButtonPrimary: "bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white",
                footerActionLink: "text-red-500 hover:text-red-600",
              }
            })
          }}
          redirectUrl="/store"
        />
      </div>
    </div>
  );
}
