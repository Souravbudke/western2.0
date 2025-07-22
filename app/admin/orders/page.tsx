"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<{[key: string]: any}>({})
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use an absolute URL with the base URL
      const apiUrl = `${getBaseUrl()}/api/orders`;
      console.log('Fetching orders from:', apiUrl);
      
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
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      const ordersData = await response.json();
      console.log(`Fetched ${ordersData.length} orders`);
      
      // Sort orders by date (newest first)
      const sortedOrders = [...ordersData].sort((a, b) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      
      // Fetch customer data for each order
      const customersMap: {[key: string]: any} = {};
      
      // Fetch all users directly from API for most up-to-date data
      try {
        const usersApiUrl = `${getBaseUrl()}/api/users`;
        console.log('Fetching users from:', usersApiUrl);
        
        const usersResponse = await fetch(`${usersApiUrl}?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
        }
        
        const allUsers = await usersResponse.json();
        console.log(`Fetched ${allUsers.length} users`);
        
        // Create a map of MongoDB IDs to user data
        const userIdMap = allUsers.reduce((map: {[key: string]: any}, user: any) => {
          if (user && user.id) {
            map[user.id] = user;
          }
          return map;
        }, {});
        
        // Create a map of Clerk IDs to user data
        const clerkIdMap = allUsers.reduce((map: {[key: string]: any}, user: any) => {
          if (user && user.clerkId) {
            map[user.clerkId] = user;
          }
          return map;
        }, {});
        
        console.log(`Created maps with ${Object.keys(userIdMap).length} userId entries and ${Object.keys(clerkIdMap).length} clerkId entries`);
        
        // Match orders with users
        for (const order of sortedOrders) {
          if (!order || !order.userId) continue;
          
          // First try to match by Clerk ID (most likely match for orders)
          if (clerkIdMap[order.userId]) {
            customersMap[order.userId] = clerkIdMap[order.userId];
            console.log(`Matched order ${order.id || order._id} to customer via Clerk ID: ${clerkIdMap[order.userId].name}`);
            continue;
          }
          
          // Then try to match by MongoDB ID
          if (userIdMap[order.userId]) {
            customersMap[order.userId] = userIdMap[order.userId];
            console.log(`Matched order ${order.id || order._id} to customer via MongoDB ID: ${userIdMap[order.userId].name}`);
            continue;
          }
          
          // If the userId is numeric, try to find the user by index
          if (/^\d+$/.test(order.userId)) {
            const numericId = parseInt(order.userId, 10) - 1; // Convert to zero-based index
            if (numericId >= 0 && numericId < allUsers.length) {
              customersMap[order.userId] = allUsers[numericId];
              console.log(`Matched order ${order.id || order._id} to customer via numeric index: ${allUsers[numericId].name}`);
            }
          }
          
          // If still not found, log it for debugging
          if (!customersMap[order.userId]) {
            console.log(`Could not match order ${order.id || order._id} with userId: ${order.userId}`);
          }
        }
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
      
      setCustomers(customersMap);
    } catch (error) {
      console.error("Error fetching orders data:", error);
      // Fallback to db directly if API fails
      try {
        const fallbackOrders = await db.getOrders();
        // Sort orders by date (newest first)
        const sortedOrders = [...fallbackOrders].sort((a, b) => {
          const dateA = new Date(a?.createdAt || 0).getTime();
          const dateB = new Date(b?.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setOrders(sortedOrders);
        
        // Fetch customer information
        const customersMap: {[key: string]: any} = {};
        
        try {
          // Get all users at once
          const allUsers = await db.getUsers();
          
          // Create a map of user IDs to user data
          const userIdMap = allUsers.reduce((map: {[key: string]: any}, user: any) => {
            if (user && user.id) {
              map[user.id] = user;
            }
            return map;
          }, {});
          
          // Match orders with users
          for (const order of sortedOrders) {
            if (!order || !order.userId) continue;
            
            // Try to find the user by ID
            if (userIdMap[order.userId]) {
              customersMap[order.userId] = userIdMap[order.userId];
              continue;
            }
            
            // If the userId is numeric, try to find the user by index
            if (/^\d+$/.test(order.userId)) {
              const numericId = parseInt(order.userId, 10) - 1; // Convert to zero-based index
              if (numericId >= 0 && numericId < allUsers.length) {
                customersMap[order.userId] = allUsers[numericId];
              }
            }
          }
        } catch (error) {
          console.error("Error fetching all users:", error);
        }
        setCustomers(customersMap);
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        toast({
          title: "Error loading orders",
          description: "Failed to load order data. Please try refreshing the page.",
          variant: "destructive"
        });
        setOrders([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80"
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
      case "shipped":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100/80"
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100/80"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Last refreshed: {new Date().toLocaleTimeString()}
          </p>
            </div>
              <Button
                variant="outline"
                onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="flex items-center w-full sm:w-auto"
          disabled={isLoading}
              >
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Loading orders...</p>
              </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
              {/* Mobile view */}
              <div className="sm:hidden space-y-4">
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No orders found.</p>
                ) : (
                  orders.map((order) => {
                    if (!order) return null;
                    const customer = customers[order.userId];
                    const customerName = customer?.name || 
                      (order.userId && order.userId.startsWith('user_') ? "Clerk User" : "Unknown");
                    
                    return (
                      <div key={order.id || order._id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm truncate">{customerName}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                          </div>
                          <Badge className={cn("ml-auto", getStatusColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t">
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Desktop view */}
              <table className="w-full text-sm hidden sm:table">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left font-medium p-2">Order ID</th>
                        <th className="text-left font-medium p-2">Date</th>
                        <th className="text-left font-medium p-2">Customer</th>
                        <th className="text-left font-medium p-2">Status</th>
                        <th className="text-right font-medium p-2">Total</th>
                        <th className="text-right font-medium p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                        if (!order) return null;
                        const customer = customers[order.userId];
                        return (
                          <tr key={order.id || order._id} className="border-b">
                          <td className="p-2 max-w-[150px] truncate">{order.id || order._id}</td>
                            <td className="p-2">{formatDate(order.createdAt)}</td>
                            <td className="p-2">
                              {customer?.name || (
                                order.userId && order.userId.startsWith('user_') ? "Clerk User" : "Unknown"
                              )}
                            </td>
                            <td className="p-2">
                            <Badge className={getStatusColor(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{formatCurrency(order.total)}</td>
                            <td className="p-2 text-right">
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                      );
                    })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  );
}
