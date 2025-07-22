"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Check, Loader2, ShoppingBag, Truck, CreditCard } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { downloadInvoice, printInvoice } from "@/lib/invoice-generator";

// Add this at the top to debug
console.log("ArrowRight import available:", typeof ArrowRight !== 'undefined');

export default function ConfirmationPage() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { cart, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // First useEffect to handle authentication check
  useEffect(() => {
    // Only check authentication after a short delay to allow Clerk to initialize
    const timer = setTimeout(() => {
      console.log('🔍 Checking authentication status:', isSignedIn ? 'Signed in' : 'Not signed in');
      setAuthChecked(true);
      
      if (!isSignedIn) {
        console.log('⚠️ User not signed in, redirecting to sign-in page');
        toast({
          title: "Sign in required",
          description: "Please sign in to complete your purchase",
          variant: "destructive",
        });
        router.push("/sign-in?redirect_url=/store/cart");
      }
    }, 1000); // Give Clerk time to initialize
    
    return () => clearTimeout(timer);
  }, [isSignedIn, router, toast]);
  
  // Second useEffect to load checkout data
  useEffect(() => {
    // Skip if auth check hasn't completed or user isn't signed in
    if (!authChecked || !isSignedIn) return;
    
    console.log('🔍 Loading checkout data...');
    
    // Check if shipping address exists
    const savedAddress = localStorage.getItem("shippingAddress");
    if (!savedAddress) {
      console.warn('⚠️ No shipping address found, redirecting to shipping page');
      toast({
        title: "Missing shipping information",
        description: "Please provide your shipping details before proceeding to payment.",
        variant: "destructive",
      });
      router.push("/store/checkout/shipping");
      return;
    }
    
    // Check if payment method exists
    const savedPaymentMethod = localStorage.getItem("paymentMethod");
    if (!savedPaymentMethod) {
      console.warn('⚠️ No payment method found, redirecting to payment page');
      toast({
        title: "Missing payment information",
        description: "Please select a payment method before proceeding to confirmation.",
        variant: "destructive",
      });
      router.push("/store/checkout/payment");
      return;
    }
    
    try {
      setShippingAddress(JSON.parse(savedAddress));
      setPaymentMethod(savedPaymentMethod);
      
      // Get payment details from localStorage
      const storedPaymentDetails = localStorage.getItem("paymentDetails");
      let parsedPaymentDetails = null;
      
      if (storedPaymentDetails) {
        parsedPaymentDetails = JSON.parse(storedPaymentDetails);
        setPaymentDetails(parsedPaymentDetails);
        console.log('✅ Payment details loaded:', parsedPaymentDetails);
        
        // If order was already created in the payment page, don't create it again
        const orderAlreadyCreated = localStorage.getItem("orderAlreadyCreated");
        if (orderAlreadyCreated === 'true') {
          console.log('✅ Order was already created in payment page, skipping auto-creation');
          
          // Show success message
          toast({
            title: "Order already processed",
            description: "Your order has been successfully placed!",
          });
          
          // Clear cart and checkout data since order is already created
          clearCart();
          localStorage.removeItem("shippingAddress");
          localStorage.removeItem("paymentMethod");
          localStorage.removeItem("paymentDetails");
          localStorage.removeItem("orderAlreadyCreated");
          
          setIsProcessing(false);
          return;
        }
        
        // Check if this is a completed PayPal payment that needs to be auto-processed
        if (savedPaymentMethod === 'paypal' && 
            parsedPaymentDetails?.status === 'completed' && 
            !orderId && 
            !isSubmitting) {
          console.log('🔄 Auto-processing PayPal order on confirmation page load');
          // We'll trigger the order placement automatically after a short delay
          // to ensure all state is properly loaded
          setTimeout(() => {
            handlePlaceOrder();
          }, 1000);
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error("❌ Error loading checkout data:", error);
      toast({
        title: "Error loading checkout data",
        description: "There was an error loading your checkout information. Please try again.",
        variant: "destructive",
      });
      router.push("/store/cart");
    }
  }, [authChecked, isSignedIn, router, toast]);
  
  // Handle place order button click
  const handlePlaceOrder = async () => {
    if (!isSignedIn || !user || !user.id) {
      console.error('❌ User not signed in or no user ID');
      toast({
        title: "Authentication required",
        description: "Please sign in to place your order",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Check if order was already created (for PayPal)
      const orderAlreadyCreated = localStorage.getItem("orderAlreadyCreated");
      if (orderAlreadyCreated === 'true') {
        console.log('✅ Order was already created, showing success message');
        
        // Show success message
        toast({
          title: "Order already processed",
          description: "Your order has been successfully placed!",
        });
        
        setIsSubmitting(false);
        return;
      }
      
      // Prepare order items
      const orderItems = cart.map((item) => ({
        productId: String(item.product.id),
        quantity: Number(item.quantity),
      }));
      
      console.log('🔍 Order items:', orderItems);
      
      // Ensure userId is a string
      const userId = String(user.id);
      console.log('🔍 User ID:', userId);
      
      // Calculate total
      const total = getCartTotal();
      console.log('🔍 Order total:', total);
      
      // Get payment details from localStorage
      const storedPaymentDetails = localStorage.getItem("paymentDetails");
      let parsedPaymentDetails = undefined;
      
      if (storedPaymentDetails) {
        try {
          parsedPaymentDetails = JSON.parse(storedPaymentDetails);
          console.log('✅ Payment details loaded from localStorage:', parsedPaymentDetails);
        } catch (e) {
          console.error('❌ Error parsing payment details:', e);
        }
      } else {
        console.warn('⚠️ No payment details found in localStorage');
      }
      
      // Determine payment status based on payment method and details
      const paymentStatus = 
        paymentMethod === "paypal" && parsedPaymentDetails?.status === "completed" 
          ? "completed" 
          : "pending";
      
      console.log('🔍 Creating order with payment method:', paymentMethod);
      console.log('🔍 Payment status:', paymentStatus);
      console.log('🔍 Shipping address:', shippingAddress);
      
      // Prepare the request payload
      const orderPayload = {
        userId,
        products: orderItems,
        status: paymentMethod === "paypal" ? "processing" : "pending",
        total,
        shippingAddress,
        paymentMethod,
        paymentStatus,
        paymentDetails: parsedPaymentDetails
      };
      
      console.log('🔍 Order payload:', orderPayload);
      
      // Create the order via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to create order:', errorData);
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const data = await response.json();
      console.log('✅ Order created successfully:', data);
      
      // Set the order ID
      if (data.order && data.order.id) {
        setOrderId(data.order.id);
        localStorage.setItem('orderId', data.order.id);
        
        // Create a complete order object with all necessary data for the invoice
        const completeOrder = {
          id: data.order.id,
          createdAt: new Date().toISOString(),
          items: cart.map(item => ({
            product: {
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              description: item.product.description || ''
            },
            quantity: item.quantity
          })),
          total: getCartTotal(),
          shippingAddress,
          paymentMethod,
          paymentStatus: paymentMethod === 'paypal' ? 'completed' : 'pending',
          paymentDetails: parsedPaymentDetails
        };
        
        // Store the complete order data
        setOrderData(completeOrder);
        localStorage.setItem('lastOrderData', JSON.stringify(completeOrder));
      }
      
      // Mark order as created to prevent duplicate orders
      localStorage.setItem('orderAlreadyCreated', 'true');
      
      // Clear cart and checkout data
      clearCart();
      
      // Show success message
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been created and is being processed!",
      });
      
      // Redirect to success page
      router.push('/store/checkout/success');
    } catch (error) {
      console.error('❌ Checkout error:', error);
      
      // Display user-friendly error message
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If cart is empty, redirect to cart page
  if (cart.length === 0 && !orderId) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-2xl">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add items to your cart to proceed with checkout.</p>
          <Button asChild>
            <Link href="/store">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // If order is already placed, show confirmation
  if (orderId) {
    return (
      <AuthGuard>
        <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col items-center justify-center">
          <Card className="w-full max-w-2xl shadow-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Order Confirmed!</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">Thank you for your purchase.</p>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base">Order Number</h3>
                <p className="text-sm bg-slate-100 p-2 rounded break-all">{orderId}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base">Order Details</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between py-2">
                      <div className="flex items-center">
                        <div className="inline-flex items-center justify-center bg-purple-100 text-purple-800 w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 text-xs flex-shrink-0">
                          {item.quantity}
                        </div>
                        <div className="truncate max-w-[120px] sm:max-w-none text-sm sm:text-base">{item.product.name}</div>
                      </div>
                      <div className="font-medium text-sm sm:text-base">{formatCurrency(item.product.price * item.quantity)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-medium border-t mt-2">
                    <span className="text-sm sm:text-base">Total</span>
                    <span className="text-sm sm:text-base text-purple-700">{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base">Shipping Address</h3>
                <div className="text-sm space-y-1 p-3 border rounded-md bg-gray-50">
                  <p className="font-medium">{shippingAddress?.fullName}</p>
                  <p className="break-words">{shippingAddress?.streetAddress}</p>
                  <p>{shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}</p>
                  <p>{shippingAddress?.country}</p>
                  <p className="mt-1">Phone: {shippingAddress?.phone}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full mb-4">
                <Button 
                  onClick={() => {
                    // Create invoice data on the fly
                    const invoiceData = {
                      id: orderId,
                      createdAt: new Date().toISOString(),
                      items: cart.map(item => ({
                        product: {
                          id: item.product.id,
                          name: item.product.name,
                          price: item.product.price,
                          description: item.product.description || ''
                        },
                        quantity: item.quantity
                      })),
                      total: getCartTotal(),
                      shippingAddress,
                      paymentMethod,
                      paymentStatus: paymentMethod === 'paypal' ? 'completed' : 'pending'
                    };
                    downloadInvoice(invoiceData);
                  }}
                  variant="secondary" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Invoice
                </Button>
                <Button 
                  onClick={() => {
                    // Create invoice data on the fly
                    const invoiceData = {
                      id: orderId,
                      createdAt: new Date().toISOString(),
                      items: cart.map(item => ({
                        product: {
                          id: item.product.id,
                          name: item.product.name,
                          price: item.product.price,
                          description: item.product.description || ''
                        },
                        quantity: item.quantity
                      })),
                      total: getCartTotal(),
                      shippingAddress,
                      paymentMethod,
                      paymentStatus: paymentMethod === 'paypal' ? 'completed' : 'pending'
                    };
                    printInvoice(invoiceData);
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Invoice
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full justify-center">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/store/account">My Account</Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/store">Continue Shopping</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </AuthGuard>
    );
  }
  
  // Show processing indicator while loading data
  if (isProcessing) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-sm sm:text-base">Loading checkout information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AuthGuard>
      <div className="container max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center justify-center">
        <div className="mb-4 sm:mb-6 w-full max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600 mb-2 text-center">
            Review & Confirm Order
          </h1>
          <div className="overflow-x-auto pb-2 mb-4">
            <div className="flex items-center space-x-1 md:space-x-2 min-w-max">
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 text-white">
                <Check className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <span className="text-xs md:text-sm dark:text-gray-200">Cart</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 text-white">
                <Check className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <span className="text-xs md:text-sm dark:text-gray-200">Shipping</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 text-white">
                <Check className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <span className="text-xs md:text-sm dark:text-gray-200">Payment</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-600 text-white">
                <span className="text-xs">4</span>
              </div>
              <span className="text-xs md:text-sm font-medium dark:text-white">Confirmation</span>
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-2xl">
          <Card className="shadow-md mb-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="border-b dark:border-gray-700">
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Order Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base dark:text-gray-300">Items ({cart.length})</h3>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-start py-2">
                      <div className="flex items-start max-w-[70%]">
                        <div className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 text-xs flex-shrink-0 mt-0.5">
                          {item.quantity}
                        </div>
                        <div className="break-words text-sm sm:text-base dark:text-gray-200">{item.product.name}</div>
                      </div>
                      <div className="font-medium ml-2 flex-shrink-0 text-sm sm:text-base dark:text-gray-200">{formatCurrency(item.product.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base dark:text-gray-300">Shipping Address</h3>
                {shippingAddress && (
                  <div className="space-y-1 text-sm sm:text-base p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 dark:border-gray-600">
                    <p className="font-medium text-gray-800 dark:text-white">{shippingAddress.fullName}</p>
                    <p className="break-words dark:text-gray-200">{shippingAddress.streetAddress}</p>
                    <p className="dark:text-gray-200">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                    <p className="dark:text-gray-200">{shippingAddress.country}</p>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Phone: {shippingAddress.phone}</p>
                  </div>
                )}
                
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-red-600 dark:text-red-400 mt-2 text-sm"
                  onClick={() => router.push("/store/checkout/shipping")}
                >
                  Edit
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2 text-sm sm:text-base dark:text-gray-300">Payment Method</h3>
                <div className="flex items-center p-3 border rounded-md bg-gray-50 dark:bg-gray-800/50 dark:border-gray-600">
                  {paymentMethod === 'paypal' ? (
                    <>
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm sm:text-base dark:text-gray-200">PayPal</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-400" />
                      <span className="text-sm sm:text-base dark:text-gray-200">Cash on Delivery</span>
                    </>
                  )}
                </div>
                
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-red-600 dark:text-red-400 mt-2 text-sm"
                  onClick={() => router.push("/store/checkout/payment")}
                >
                  Edit
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="dark:text-gray-200">{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="dark:text-gray-200">Free</span>
                </div>
                <Separator className="my-2 dark:bg-gray-600" />
                <div className="flex justify-between font-medium text-base sm:text-lg pt-2">
                  <span className="dark:text-white">Total</span>
                  <span className="text-purple-700 dark:text-purple-400">{formatCurrency(getCartTotal())}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 sm:pt-6 border-t dark:border-gray-700 flex flex-col">
              <Button
                className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-medium py-2 h-auto mb-3 dark:from-red-700 dark:to-purple-700 dark:hover:from-red-800 dark:hover:to-purple-800"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground dark:text-gray-400 text-center">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
