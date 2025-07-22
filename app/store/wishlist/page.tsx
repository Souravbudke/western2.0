"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils"
import { useWishlist } from "@/hooks/use-wishlist"
import { useCart } from "@/lib/cart-provider"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, Trash2, ChevronLeft, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function WishlistPage() {
  const { wishlist, removeItem } = useWishlist()
  const { addToCart } = useCart()
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleRemoveFromWishlist = (id: string) => {
    removeItem(id)
    toast({
      description: "Item removed from wishlist",
    })
  }

  const handleAddToCart = (item: any) => {
    // Create a product object that matches the expected format
    const product = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image || "",
      stock: 0 // Default value since wishlist items might not have stock info
    }
    
    // Add to cart using the correct method
    addToCart(product, 1)
    
    // Remove the item from wishlist after adding to cart
    removeItem(item.id)
    toast({
      description: "Product added to cart",
    })
  }

  if (!isMounted) {
    return null // To avoid hydration errors
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href="/store/products" className="inline-flex items-center text-sm mb-2 text-foreground hover:text-foreground/80 transition-colors">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Products
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Wishlist</h1>
          </div>
          {wishlist.length > 0 && (
            <Button 
              variant="outline" 
              className="sm:self-end border-border text-foreground hover:bg-accent"
              onClick={() => {
                wishlist.forEach(item => {
                  handleAddToCart(item)
                })
                toast({
                  title: "Added all items to cart",
                  description: `${wishlist.length} items added to your cart`,
                })
              }}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add All to Cart
            </Button>
          )}
        </div>
        
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16">
            <Heart className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Products you save to your wishlist will appear here. Discover products and save your favorites!
            </p>
            <Link href="/store/products">
              <Button>
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="group overflow-hidden h-full flex flex-col border-border hover:border-primary/60 hover:shadow-md transition-all rounded-xl">
                    <Link href={`/store/products/${item.id}`} className="relative">
                      <div className="relative aspect-square overflow-hidden bg-accent dark:bg-accent/50 rounded-t-xl">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-accent dark:bg-accent/50">
                            <ShoppingBag className="h-12 w-12 text-primary/70 dark:text-primary/60" />
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm dark:bg-black/50 hover:bg-white dark:hover:bg-black cursor-pointer rounded-lg"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFromWishlist(item.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive hover:text-destructive/80" />
                      </Badge>
                    </Link>
                    <CardContent className="flex-1 p-4">
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-normal text-xs bg-accent/50 text-foreground border-border">
                          {item.category}
                        </Badge>
                        <h3 className="font-medium text-lg line-clamp-1 text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex items-center justify-between">
                      <p className="font-semibold text-lg text-foreground">{formatCurrency(item.price)}</p>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" /> Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}