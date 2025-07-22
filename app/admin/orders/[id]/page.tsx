"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { OrderDetails } from "@/app/admin/_components/order-details"
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

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const fetchOrder = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      const apiUrl = `${getBaseUrl()}/api/orders/${orderId}`;
      console.log('Fetching order from:', apiUrl);
      
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
        throw new Error(`Failed to fetch order: ${response.status} ${response.statusText}`);
      }
      
      const orderData = await response.json();
      console.log('Fetched order data:', orderData);
      
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId, toast]);
  
  // Fetch order on mount
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);
  
  const handleRefresh = () => {
    fetchOrder();
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
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Order Details
          </h1>
        </div>
        
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
      </div>
      
      <Card className="p-6">
        <OrderDetails order={order} />
      </Card>
    </div>
  );
} 