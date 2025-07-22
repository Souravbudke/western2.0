"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Order } from "@/lib/db"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

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

export default function OrderDetailsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [productDetails, setProductDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    async function fetchOrder() {
      try {
        setIsLoading(true)
        const response = await fetch(`${getBaseUrl()}/api/orders/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }
        
        const data = await response.json()
        setOrder(data)

        // Fetch product details
        if (data?.products?.length) {
          const details: Record<string, any> = {};
          const productPromises = data.products.map(async (item: any) => {
            try {
              const response = await fetch(`/api/products/${item.productId}`);
              if (response.ok) {
                const product = await response.json();
                return { id: item.productId, product };
              }
              return { id: item.productId, product: null };
            } catch (error) {
              console.error(`Error fetching product ${item.productId}:`, error);
              return { id: item.productId, product: null };
            }
          });
          
          const results = await Promise.all(productPromises);
          results.forEach(result => {
            details[result.id] = result.product;
          });
          setProductDetails(details);
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id, toast])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button asChild>
              <Link href="/store/account">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/store/account" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Order <span className="break-all">{`#${order.id}`}</span></h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} w-fit`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal || order.total || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shipping || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax || 0)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.streetAddress}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-1">Phone: {order.shippingAddress.phone}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-2">Product</th>
                  <th className="text-center font-medium p-2">Quantity</th>
                  <th className="text-right font-medium p-2">Price</th>
                  <th className="text-right font-medium p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.products?.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">
                      <p className="font-medium">
                        Product ID: <span className="break-all md:break-normal overflow-hidden text-ellipsis">{item.productId}</span>
                      </p>
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(order.total / order.products.length)}</td>
                    <td className="p-2 text-right">{formatCurrency((order.total / order.products.length) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {order.paymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>
                  {order.paymentMethod === 'paypal' ? 'PayPal' : 
                   order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 
                   'Not specified'}
                </span>
              </div>
              {order.paymentStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className={`w-fit ${
                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }`}>
                    {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 