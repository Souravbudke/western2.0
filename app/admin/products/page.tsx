"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Helper function to get the base URL
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use current path
    return window.location.origin;
  }
  // SSR should use vercel url
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost
  return 'http://localhost:3000';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use an absolute URL with the base URL
      const apiUrl = `${getBaseUrl()}/api/products`;
      console.log('Fetching products from:', apiUrl);
      
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const response = await fetch(`${apiUrl}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const productsData = await response.json();
      console.log(`Fetched ${productsData.length} products`);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products data:", error);
      // Fallback to db directly if API fails
      try {
        const fallbackProducts = await db.getProducts();
        setProducts(fallbackProducts);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        toast({
          title: "Error loading products",
          description: "Failed to load product data. Please try refreshing the page.",
          variant: "destructive"
        });
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Last refreshed: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/admin/products/new">
            <Button className="flex items-center w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Loading products...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-2">Name</th>
                    <th className="text-left font-medium p-2">Category</th>
                    <th className="text-right font-medium p-2">Price</th>
                    <th className="text-right font-medium p-2">Stock</th>
                    <th className="text-right font-medium p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.category}</td>
                      <td className="p-2 text-right">{formatCurrency(product.price)}</td>
                      <td className="p-2 text-right">{product.stock}</td>
                      <td className="p-2 text-right">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No products found. Create your first product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
