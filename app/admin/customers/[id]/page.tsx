"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, Phone, Calendar, Package, ShoppingCart } from "lucide-react"
import Link from "next/link"

// Helper function to get the base URL
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

// Format date to readable string
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default function CustomerDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<any>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function fetchCustomerData() {
      if (!params?.id) return
      
      setIsLoading(true)
      try {
        // Fetch customer data
        const customerResponse = await fetch(`${getBaseUrl()}/api/users/${params.id}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        })
        
        if (!customerResponse.ok) {
          throw new Error('Failed to fetch customer data')
        }
        
        const customerData = await customerResponse.json()
        setCustomer(customerData)
        
        // Fetch customer orders
        try {
          // Check if customer has a clerkId and use it to fetch orders
          if (customerData.clerkId) {
            // Fetch orders using clerkId (which is stored as userId in orders)
            const ordersApiUrl = `${getBaseUrl()}/api/orders?userId=${customerData.clerkId}`
            console.log('Fetching orders using clerkId:', ordersApiUrl)
            
            const ordersResponse = await fetch(ordersApiUrl, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              cache: 'no-store',
              next: { revalidate: 0 }
            })
            
            if (ordersResponse.ok) {
              const ordersData = await ordersResponse.json()
              console.log(`Fetched ${ordersData.length} orders for customer using clerkId`)
              setCustomerOrders(ordersData)
            } else {
              console.error(`Failed to fetch orders with clerkId: ${ordersResponse.status} ${ordersResponse.statusText}`)
              
              // Fall back to MongoDB ID as backup
              const fallbackOrdersApiUrl = `${getBaseUrl()}/api/orders?userId=${params.id}`
              console.log('Fallback: Fetching orders using MongoDB ID:', fallbackOrdersApiUrl)
              
              const fallbackOrdersResponse = await fetch(fallbackOrdersApiUrl, {
                method: 'GET',
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                },
                cache: 'no-store',
                next: { revalidate: 0 }
              })
              
              if (fallbackOrdersResponse.ok) {
                const fallbackOrdersData = await fallbackOrdersResponse.json()
                console.log(`Fetched ${fallbackOrdersData.length} orders for customer using MongoDB ID`)
                setCustomerOrders(fallbackOrdersData)
              } else {
                console.error(`Failed to fetch orders with MongoDB ID: ${fallbackOrdersResponse.status}`)
                toast({
                  title: "Error loading orders",
                  description: "Could not load customer orders. Please try again.",
                  variant: "destructive"
                })
              }
            }
          } else {
            // If no clerkId, try with MongoDB ID
            const ordersApiUrl = `${getBaseUrl()}/api/orders?userId=${params.id}`
            console.log('Fetching orders using MongoDB ID (no clerkId available):', ordersApiUrl)
            
            const ordersResponse = await fetch(ordersApiUrl, {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              cache: 'no-store',
              next: { revalidate: 0 }
            })
            
            if (ordersResponse.ok) {
              const ordersData = await ordersResponse.json()
              console.log(`Fetched ${ordersData.length} orders for customer using MongoDB ID`)
              setCustomerOrders(ordersData)
            } else {
              console.error(`Failed to fetch orders: ${ordersResponse.status} ${ordersResponse.statusText}`)
              toast({
                title: "Error loading orders",
                description: "Could not load customer orders. Please try again.",
                variant: "destructive"
              })
            }
          }
        } catch (orderError) {
          console.error("Error fetching customer orders:", orderError)
        }
      } catch (error) {
        console.error("Error fetching customer details:", error)
        toast({
          title: "Error loading customer",
          description: "Could not load customer details. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCustomerData()
  }, [params?.id, toast])
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading customer details...</p>
        </div>
      </div>
    )
  }
  
  if (!customer) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground">The customer you're looking for might have been removed.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
{/*         <div className="text-sm text-muted-foreground">
          {customer.clerkId && (
            <div className="flex items-center">
              <span>Clerk ID: {customer.clerkId}</span>
            </div>
          )}
        </div> */}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
              <h3 className="text-xl font-semibold">{customer.name}</h3>
              <div className="flex items-center text-muted-foreground mt-1">
                <Mail className="h-4 w-4 mr-2" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center text-muted-foreground mt-1">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {customer.createdAt ? formatDate(customer.createdAt) : 'N/A'}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Account Status</h4>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${true ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{true ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              This customer has placed {customerOrders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">No orders found for this customer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left font-medium p-2">Order ID</th>
                    <th className="text-left font-medium p-2">Date</th>
                      <th className="text-right font-medium p-2">Amount</th>
                      <th className="text-right font-medium p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                    {customerOrders.map((order) => (
                      <tr key={order.id || order._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">
                          <Link href={`/admin/orders/${order.id || order._id}`} className="text-red-600 hover:underline">
                            #{order.orderNumber || (order.id || order._id).substring(0, 8)}
                          </Link>
                        </td>
                        <td className="p-2">{order.createdAt ? formatDate(order.createdAt) : 'N/A'}</td>
                        <td className="p-2 text-right">
                          ₹ {order.total ? order.total.toFixed(2) : '0.00'}
                        </td>
                        <td className="p-2 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              order.status === 'completed' ? 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white' :
                              order.status === 'processing' ? 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                              order.status === 'pending' ? 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                            }
                          `}>
                            {order.status || 'Unknown'}
                          </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
