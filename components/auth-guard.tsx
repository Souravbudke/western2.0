"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"

type AuthGuardProps = {
  children: React.ReactNode
  allowedRoles?: ("admin" | "customer")[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded) {
      // Not authenticated
      if (!user) {
        router.push(`/sign-in?redirect_url=${pathname ? encodeURIComponent(pathname) : ''}`)
        return
      }

      // Role-based access control
      if (allowedRoles) {
        const userRole = user.publicMetadata.role as string | undefined
        if (!userRole || !allowedRoles.includes(userRole as any)) {
          if (userRole === "admin") {
            router.push("/admin")
          } else {
            router.push("/store")
          }
          return
        }
      }
    }
  }, [user, isLoaded, router, pathname, allowedRoles])

  // Show loading or render children
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles) {
    const userRole = user.publicMetadata.role as string | undefined
    if (!userRole || !allowedRoles.includes(userRole as any)) {
      return null
    }
  }

  return <>{children}</>
}
