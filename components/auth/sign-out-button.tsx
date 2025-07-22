"use client"

import React from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface SignOutButtonProps {
  children: React.ReactNode
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  return (
    <div onClick={handleSignOut}>
      {children}
    </div>
  )
} 