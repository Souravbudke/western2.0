"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useWishlist } from "@/hooks/use-wishlist"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface AddToWishlistButtonProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    category: string
    image?: string
  }
  variant?: "default" | "outline" | "icon"
}

export default function AddToWishlistButton({ product, variant = "default" }: AddToWishlistButtonProps) {
  const { isInWishlist, addItem, removeItem } = useWishlist()
  const [isLoading, setIsLoading] = useState(false)
  
  const inWishlist = isInWishlist(product.id)
  
  const handleToggleWishlist = async () => {
    try {
      setIsLoading(true)
      
      if (inWishlist) {
        removeItem(product.id)
        toast({
          description: "Product removed from wishlist",
        })
      } else {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.image || "",
        })
        toast({
          description: "Product added to wishlist",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Something went wrong",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (variant === "icon") {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700"
        onClick={handleToggleWishlist}
        disabled={isLoading}
      >
        <Heart className={cn("h-5 w-5", inWishlist && "fill-[#FF8C94] text-[#FF8C94]")} />
        <span className="sr-only">Add to wishlist</span>
      </Button>
    )
  }
  
  if (variant === "outline") {
    return (
      <Button 
        variant="outline" 
        className={cn(
          "w-full border-[#F7CAD0] text-[#9D8189]",
          inWishlist && "bg-[#F7CAD0]/10"
        )}
        onClick={handleToggleWishlist}
        disabled={isLoading}
      >
        <Heart className={cn("mr-2 h-5 w-5", inWishlist && "fill-[#FF8C94] text-[#FF8C94]")} />
        {inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
      </Button>
    )
  }
  
  return (
    <Button
      className={cn(
        "bg-[#F5E6CC] hover:bg-[#F0DCBB] text-[#9D8189]",
        inWishlist && "bg-[#F7CAD0]/20 hover:bg-[#F7CAD0]/30"
      )}
      onClick={handleToggleWishlist}
      disabled={isLoading}
    >
      <Heart className={cn("mr-2 h-5 w-5", inWishlist && "fill-[#FF8C94] text-[#FF8C94]")} />
      {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    </Button>
  )
}