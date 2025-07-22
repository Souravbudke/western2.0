"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams ? searchParams.get("returnUrl") : null
  
  useEffect(() => {
    // Redirect to the new Clerk sign-in page
    const redirectUrl = new URL("/sign-in", window.location.origin)
    if (returnUrl) {
      redirectUrl.searchParams.set("redirect_url", returnUrl)
    }
    router.replace(redirectUrl.toString())
  }, [router, returnUrl])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sign-in page...</p>
      </div>
    </div>
  )
}
