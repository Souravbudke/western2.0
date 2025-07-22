"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@clerk/nextjs"
import { UserProfile } from "@clerk/nextjs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Order } from "@/lib/db"
import { Loader2 } from "lucide-react"

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

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  // Fetch orders when component mounts
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch orders from the API using the userId parameter
        const ordersApiUrl = `${getBaseUrl()}/api/orders?userId=${user.id}`
        console.log(`Fetching orders for user ${user.id} from: ${ordersApiUrl}`)
        
        const response = await fetch(ordersApiUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }
        
        const userOrders = await response.json()
        console.log(`Fetched ${userOrders.length} orders for user ${user.id}`)
        setOrders(userOrders)
      } catch (error) {
        console.error("Error fetching user orders:", error)
        setError("Failed to load your orders. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (isLoaded && user) {
      fetchOrders()
    }
  }, [user, isLoaded])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // AuthGuard will handle redirect
  }

  const getStatusColor = (status: string) => {
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
  }

  return (
    <AuthGuard>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">My Account</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="clerk-profile-wrapper">
                    <style jsx global>{`
                      .clerk-profile-wrapper > div,
                      .clerk-profile-wrapper > div > div,
                      .clerk-profile-wrapper > div > div > div {
                        width: 100% !important;
                        max-width: 100% !important;
                      }
                      @media (max-width: 768px) {
                        .clerk-profile-wrapper {
                          display: flex;
                          justify-content: center;
                        }
                        .cl-card {
                          padding: 1rem !important;
                          margin: 0 !important;
                        }
                        .cl-navbar-menu {
                          padding: 0 !important;
                        }
                      }
                    `}</style>
                    <UserProfile routing="hash" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your past orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <p>Loading your orders...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-6">
                      <p className="text-destructive mb-4">{error}</p>
                      <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                      <Link href="/store/products">
                        <Button>Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-6">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-medium p-4">Order ID</th>
                            <th className="text-left font-medium p-4">Date</th>
                            <th className="text-left font-medium p-4">Status</th>
                            <th className="text-right font-medium p-4">Total</th>
                            <th className="text-right font-medium p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id} className="border-b">
                              <td className="p-4 max-w-[150px] truncate">{order.id}</td>
                              <td className="p-4">{formatDate(order.createdAt)}</td>
                              <td className="p-4">
                                <Badge className={`w-fit ${getStatusColor(order.status)}`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">{formatCurrency(order.total)}</td>
                              <td className="p-4 text-right">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/store/orders/${order.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
