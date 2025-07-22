"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user, router])

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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <Button onClick={() => router.back()}>Back to Account</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal information and account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
              <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.fullName}</h2>
              <p className="text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="font-medium text-sm">User ID</h3>
              <p className="text-sm text-muted-foreground">{user.id}</p>
            </div>
            
            <div className="grid gap-2">
              <h3 className="font-medium text-sm">Email Verification</h3>
              <p>{user.primaryEmailAddress?.verification.status === 'verified' ? 'Verified' : 'Not verified'}</p>
            </div>

            <div className="grid gap-2">
              <h3 className="font-medium text-sm">Account Created</h3>
              <p>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button onClick={() => window.open('https://accounts.clerk.dev/user/profile', '_blank')}>
              Manage Profile on Clerk
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
