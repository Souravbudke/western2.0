"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-provider"
import { useUser } from "@clerk/nextjs"
import { toast } from "@/components/ui/use-toast"

interface CheckoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children?: React.ReactNode
}

export function CheckoutButton({ className, children, ...props }: CheckoutButtonProps) {
  const { cart } = useCart()
  const { isSignedIn } = useUser()
  const router = useRouter()

  const handleCheckout = () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "You need to sign in to checkout",
      })
      
      // Store intent to checkout
      localStorage.setItem("checkoutIntent", "true")
      
      // Redirect to sign in
      router.push("/sign-in")
      return
    }
    
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart to checkout",
      })
      return
    }
    
    // Proceed to shipping page
    router.push("/store/checkout/shipping")
  }

  return (
    <Button 
      onClick={handleCheckout} 
      className={`sneakers-cta-button hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      {children || "Checkout"}
    </Button>
  )
}
