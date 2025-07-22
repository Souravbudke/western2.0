"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { OrderStatusForm } from "@/app/admin/orders/_components/order-status-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderDetailsProps {
  order: any
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const { toast } = useToast()
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [productDetails, setProductDetails] = useState<Record<string, any>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // Fetch product details for all products in the order
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!order?.products?.length) return;
      
      setIsLoadingProducts(true);
      const details: Record<string, any> = {};
      
      try {
        // Fetch details for each product in parallel
        const productPromises = order.products.map(async (item: any) => {
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
        
        // Convert array to object with productId as key
        results.forEach(result => {
          details[result.id] = result.product;
        });
        
        setProductDetails(details);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    fetchProductDetails();
  }, [order?.products, toast]);

  if (!order) {
    return <div className="text-center py-6">Order not found</div>
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "processing":
        return "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "shipped":
        return "bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200";
      case "delivered":
        return "bg-gray-500 text-white dark:bg-gray-500 dark:text-white";
      case "cancelled":
        return "bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold break-all">Order #{order.id}</h2>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </Badge>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsStatusDialogOpen(true)}
              className="flex-1 sm:flex-none"
            >
              Update Status
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex-1 sm:flex-none"
            >
              Delete Order
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="font-medium">{order.user?.name || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{order.user?.email || "N/A"}</p>
              </div>
              {order.user && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/customers/${order.user.id}`}>
                    View Customer
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal || 0)}</span>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge className={
                  order.paymentStatus === 'completed' ? 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white' :
                  order.paymentStatus === 'pending' ? 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                  order.paymentStatus === 'failed' ? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-gray-900' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                }>
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Unknown'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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
                {isLoadingProducts ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </td>
                  </tr>
                ) : (
                  order.products?.map((item: any, index: number) => {
                    const product = productDetails[item.productId];
                    const unitPrice = product?.price || (order.total / (order.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 1));
                    
                    return (
                      <tr key={`${item.productId}-${index}`} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center">
                            <div className="h-10 w-10 mr-3 bg-secondary rounded overflow-hidden">
                              <img 
                                src={product?.image || "/placeholder.svg?height=40&width=40"} 
                                alt={product?.name || "Product"} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product?.name || `Product ID: ${item.productId}`}</p>
                              <Link 
                                href={`/admin/products/${item.productId}`}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View Product
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(unitPrice)}</td>
                        <td className="p-2 text-right">{formatCurrency(unitPrice * item.quantity)}</td>
                      </tr>
                    );
                  })
                )}
                {!isLoadingProducts && !order.products?.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      No items in this order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            onClose={() => setIsStatusDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    const response = await fetch(`/api/orders/${order.id}`, {
                      method: 'DELETE',
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete order');
                    }
                    
                    // Show success toast
                    toast({
                      title: "Success",
                      description: "Order deleted successfully",
                      variant: "default",
                    });
                    
                    // Redirect to orders page after successful deletion
                    window.location.href = '/admin/orders';
                  } catch (error) {
                    console.error('Error deleting order:', error);
                    toast({
                      title: "Error",
                      description: "Failed to delete order",
                      variant: "destructive",
                    })
                  } finally {
                    setIsDeleting(false);
                    setIsDeleteDialogOpen(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}