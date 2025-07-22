"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ProductForm } from "@/app/admin/_components/product-form"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const productId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  // Check if we're creating a new product
  const isNewProduct = productId === 'new';
  
  const fetchProduct = useCallback(async () => {
    if (isNewProduct) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      const apiUrl = `${getBaseUrl()}/api/products/${productId}`;
      console.log('Fetching product from:', apiUrl);
      
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      const response = await fetch(`${apiUrl}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }
      
      const productData = await response.json();
      console.log('Fetched product data:', productData);
      
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [productId, isNewProduct, toast]);
  
  // Fetch product on mount
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);
  
  const handleRefresh = () => {
    fetchProduct();
  };
  
  const handleFormSuccess = () => {
    // Successful submission will navigate back to products list
    router.push('/admin/products');
    router.refresh();
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[600px] rounded-md" />
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewProduct ? 'Add New Product' : 'Edit Product'}
          </h1>
        </div>
        
        {!isNewProduct && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>
      
      <Card className="p-6">
        <ProductForm 
          product={isNewProduct ? null : product} 
          onSuccess={handleFormSuccess} 
        />
      </Card>
    </div>
  );
} 