"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Heart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useWishlist } from "@/hooks/use-wishlist"
import { useCart } from "@/lib/cart-provider"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Product } from "@/lib/db"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    category: string
    image?: string
    stock?: number
  }
  isBestSeller?: boolean
}

export default function ProductCard({ product, isBestSeller }: ProductCardProps) {
  const { isInWishlist, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  
  const inWishlist = isInWishlist(product.id)

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      if (inWishlist) {
        removeFromWishlist(product.id)
        toast({
          description: "Product removed from wishlist",
        })
      } else {
        addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || "",
          category: product.category,
          description: product.description
        })
        toast({
          description: "Product added to wishlist",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update wishlist",
        variant: "destructive",
      })
    }
  }
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create a product object that conforms to the Product type
    const productToAdd: Product = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image || "", // Ensure image is not undefined
      stock: product.stock || 0   // Ensure stock is not undefined
    }
    
    addToCart(productToAdd, 1)
    
    toast({
      description: "Product added to cart",
    })
  }

  return (
    <Card className="group overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow duration-300 border-[#F7CAD0]/20 hover:border-[#F7CAD0]/60 rounded-xl">
      <Link href={`/store/products/${product.id}`} className="flex-1 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-[#FFF1F3] dark:bg-gray-800 rounded-t-xl">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#FFF1F3] dark:bg-gray-800">
              <ShoppingBag className="h-12 w-12 text-[#F7CAD0] dark:text-[#F7CAD0]/60" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {isBestSeller && (
            <div className="absolute top-2 left-2 bg-[#FF8C94] text-white px-2 py-1 rounded-full text-xs font-medium z-10 shadow-sm">
              Best Seller
            </div>
          )}
          
          <div className="absolute top-2 right-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 shadow-sm"
              onClick={handleToggleWishlist}
            >
              <Heart className={cn("h-5 w-5", inWishlist && "fill-[#FF8C94] text-[#FF8C94]")} />
            </Button>
          </div>
        </div>
        
        <CardContent className="flex-1 p-4">
          <div className="space-y-2">
            <Badge variant="outline" className="font-normal text-xs bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 rounded-lg">
              {product.category}
            </Badge>
            <h3 className="font-medium text-lg line-clamp-1 mt-1">{product.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="mt-1 font-medium text-black dark:text-white">
            {formatCurrency(product.price)}
          </div>
          <Button 
            size="sm" 
            className="rounded-full sneakers-cta-button"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardFooter>
      </Link>
    </Card>
  )
}