"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CircleOff, ShoppingBag, Loader2 } from "lucide-react"
import { Product } from "@/lib/db"

interface StockDisplayProps {
  product: Product
  refreshInterval?: number  // How often to refresh the stock count (in milliseconds)
}

export default function StockDisplay({ product, refreshInterval = 60000 }: StockDisplayProps) {
  const [stock, setStock] = useState(product.stock)
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
      setStock(data.stock)
    } catch (err) {
      console.error('Error fetching stock:', err)
      setError('Failed to update stock information')
      // Keep the existing stock value if fetching fails
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch stock information when component mounts
  useEffect(() => {
    fetchStockInfo()
    
    // Set up interval to refresh stock info
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchStockInfo, refreshInterval)
      
      // Clean up interval on component unmount
      return () => clearInterval(intervalId)
    }
  }, [product.id, refreshInterval])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge 
          variant={stock > 0 ? "outline" : "destructive"} 
          className={`px-2 py-1 ${stock > 0 
            ? "border-border bg-background/50 text-foreground" 
            : "bg-destructive border-destructive text-destructive-foreground"}`}
        >
          {stock > 0 ? (
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              <span>In Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <CircleOff className="h-3 w-3" />
              <span>Out of Stock</span>
            </div>
          )}
        </Badge>
        
        {isLoading && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </span>
        )}
        
        {error && (
          <span className="text-sm text-destructive">
            {error}
          </span>
        )}
      </div>
      
      {stock > 0 && (
        <span className="text-sm text-foreground">
          {stock} {stock === 1 ? "unit" : "units"} available
        </span>
      )}
    </div>
  )
}