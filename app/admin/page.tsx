"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, cn } from "@/lib/utils"
import { Package, ShoppingCart, Users, RefreshCw, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
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

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [customersData, setCustomersData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const { toast } = useToast()
  const router = useRouter()
  
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use an absolute URL with the base URL for all API calls
      const baseUrl = getBaseUrl();
      const timestamp = new Date().getTime(); // Add timestamp to prevent caching
      
      // Fixed fetch options with correct types
      const commonFetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store' as RequestCache,
      };
      
      // Fetch products
      console.log('Fetching products data...');
      const productsRes = await fetch(`${baseUrl}/api/products?t=${timestamp}`, commonFetchOptions);
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const productsData = await productsRes.json();
      setProducts(productsData);
      
      // Fetch orders
      console.log('Fetching orders data...');
      const ordersRes = await fetch(`${baseUrl}/api/orders?t=${timestamp}`, commonFetchOptions);
      if (!ordersRes.ok) throw new Error('Failed to fetch orders');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
      
      // Fetch users
      console.log('Fetching users data...');
      const usersRes = await fetch(`${baseUrl}/api/users?t=${timestamp}`, commonFetchOptions);
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const allUsersData = await usersRes.json();
      const customersData = allUsersData.filter((user: any) => user?.role === "customer");
      setUsers(customersData);
      
      // Process recent orders
      const sortedOrders = [...ordersData].sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
      }).slice(0, 5);
      setRecentOrders(sortedOrders);
      
      // Fetch customer data for recent orders
      const customerDetails = await Promise.all(
        sortedOrders.map(async (order) => {
          if (!order) return null;
          try {
            const userRes = await fetch(`${baseUrl}/api/users/${order.userId}?t=${timestamp}`, commonFetchOptions);
            if (!userRes.ok) return null;
            return await userRes.json();
          } catch (error) {
            console.error(`Error fetching user data for order ${order.id}:`, error);
            return null;
          }
        })
      );
      setCustomersData(customerDetails);
      
      setLastRefreshed(new Date());
      toast({
        title: "Dashboard refreshed",
        description: "Latest data has been loaded.",
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error refreshing data",
        description: "There was a problem loading the dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);
  
  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + (order?.total || 0), 0);

  // Function to get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-200 text-gray-800 hover:bg-gray-200/80 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-800/90";
      case "processing":
        return "bg-gray-300 text-gray-700 hover:bg-gray-300/80 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/90";
      case "shipped":
        return "bg-gray-400 text-gray-800 hover:bg-gray-400/80 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-600/90";
      case "delivered":
        return "bg-gray-500 text-white hover:bg-gray-500/80 dark:bg-gray-500 dark:text-white dark:hover:bg-gray-500/90";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-900/90";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          disabled={isLoading}
          className="flex items-center w-full sm:w-auto"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From {orders.length} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.length}
              </div>
              <p className="text-xs text-muted-foreground">Active products in store</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">Registered customer accounts</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button onClick={() => router.push('/admin/orders')} size="sm" variant="ghost" className="gap-1 text-sm">
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Mobile view */}
              <div className="sm:hidden space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => {
                    if (!order) return null;
                    const customer = customersData[index];
                    return (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm truncate">{customer?.name || "Unknown"}</p>
                            {/* Order ID removed from mobile view */}
                          </div>
                          <Badge className={cn(getStatusBadge(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">No orders found.</p>
                )}
              </div>

              {/* Desktop view */}
              <table className="w-full text-sm hidden sm:table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-2">Order ID</th>
                    <th className="text-left font-medium p-2">Customer</th>
                    <th className="text-left font-medium p-2">Status</th>
                    <th className="text-right font-medium p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order, index) => {
                      if (!order) return null;
                      const customer = customersData[index];
                      return (
                        <tr key={order.id} className="border-b hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                          <td className="p-2 max-w-[150px] truncate">{order.id}</td>
                          <td className="p-2">{customer?.name || "Unknown"}</td>
                          <td className="p-2">
                            <Badge className={getStatusBadge(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">{formatCurrency(order.total)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No orders found.
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
