import type React from "react"
import { StoreLayout } from "@/components/store/store-layout"
import { CartProvider } from "@/lib/cart-provider"

export default function StoreRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      <StoreLayout>{children}</StoreLayout>
    </CartProvider>
  )
}
