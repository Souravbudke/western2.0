"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-provider"
import { useToast } from "@/hooks/use-toast"
import { Minus, Plus, ShoppingCart, AlertCircle } from "lucide-react"
import { Product } from "@/lib/db"

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [currentStock, setCurrentStock] = useState(product.stock)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStockInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/products/${product.id}/stock`, {
        cache: 'no-store',
        next: { revalidate: 0 }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock information')
      }
      
      const data = await response.json()
      setCurrentStock(data.stock)
      
      // If current quantity is more than available stock, adjust it
      if (quantity > data.stock) {
        setQuantity(Math.max(1, data.stock))
      }
    } catch (err) {
      console.error('Error fetching stock:', err)
      setError('Failed to update stock information')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stock information when component mounts
  useEffect(() => {
    fetchStockInfo()
    
    // Set up interval to refresh stock info every 30 seconds
    const intervalId = setInterval(fetchStockInfo, 30000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [product.id])

  const incrementQuantity = () => {
    if (quantity < currentStock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleAddToCart = () => {
    // Create an updated product object with current stock
    const updatedProduct = {
      ...product,
      stock: currentStock
    }
    
    addToCart(updatedProduct, quantity)
    toast({
      title: "Added to cart",
      description: `${quantity} × ${product.name} added to your cart`,
    })
    
    // Refresh stock after adding to cart to ensure accuracy
    fetchStockInfo()
  }

  return (
    <>
      <div className="flex items-center space-x-4 mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={decrementQuantity} 
          disabled={quantity <= 1 || currentStock === 0}
          className="border-border text-foreground hover:bg-accent"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-lg font-medium text-foreground">{quantity}</span>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={incrementQuantity} 
          disabled={quantity >= currentStock || currentStock === 0}
          className="border-border text-foreground hover:bg-accent"
        >
          <Plus className="h-4 w-4" />
        </Button>
        {isLoading && <span className="text-xs text-muted-foreground">Updating...</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Button 
        className="w-full" 
        size="lg" 
        onClick={handleAddToCart} 
        disabled={currentStock === 0}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Add to Cart
      </Button>
    </>
  )
}