"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/cart-provider"
import { formatCurrency } from "@/lib/utils"
import { Minus, Plus, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CheckoutButton } from "@/components/store/checkout-button"

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart()
  const router = useRouter()
  const { toast } = useToast()

  if (cart.length === 0) {
    return (
      <div className="container mx-auto flex items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
        <div className="text-center max-w-md mx-auto py-16 px-4">
          <div className="mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-primary mb-4"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to your cart to continue shopping.</p>
          <Link href="/store/products">
            <Button className="px-8 py-2">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-foreground">Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row gap-4 py-4 border-b border-border/50 last:border-0">
                  <div className="flex-shrink-0">
                    <div className="relative rounded-lg overflow-hidden w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] border border-border">
                      <Image
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.category}</p>
                    <p className="font-medium mt-1 text-foreground">{formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-border text-foreground hover:bg-accent"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-foreground">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-border text-foreground hover:bg-accent"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                      <Trash className="h-4 w-4 text-[#984447]" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-foreground">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between">
                <span className="text-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(getCartTotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Shipping</span>
                <span className="text-[#CAD2C5]">Free</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex justify-between font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatCurrency(getCartTotal())}</span>
              </div>
            </CardContent>
            <CardFooter>
              <CheckoutButton className="w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
