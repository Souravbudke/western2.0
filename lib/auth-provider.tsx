"use client"

import type React from "react"
import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/nextjs"

// No need for custom types as we're using Clerk's types

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Wrap the children with ClerkProvider
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}

// Export Clerk's hooks for use throughout the app
export { useClerkAuth as useAuth, useUser }
