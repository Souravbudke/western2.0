"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Truck, Loader2, CheckCircle, Check, ClipboardCopy } from "lucide-react";
import { useCart } from "@/lib/cart-provider";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { downloadInvoice, printInvoice } from "@/lib/invoice-generator";
import Image from "next/image";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PayPalOrder {
  id: string;
  status: string;
  paymentUrl: string;
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();
  const { cart, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"paypal" | "cash_on_delivery">("cash_on_delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [paypalOrder, setPaypalOrder] = useState<PayPalOrder | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // State to track if authentication has been checked
  const [authChecked, setAuthChecked] = useState(false);
  
  // First check authentication
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔍 Payment page - Authentication status:', isSignedIn ? 'Signed in' : 'Not signed in');
      setAuthChecked(true);
      
      if (!isSignedIn) {
        console.log('⚠️ User not signed in, redirecting to sign-in page');
        toast({
          title: "Sign in required",
          description: "Please sign in to complete your purchase",
          variant: "destructive",
        });
        router.push("/sign-in?redirect_url=/store/checkout/payment");
      }
    }, 1000); // Give Clerk time to initialize
    
    return () => clearTimeout(timer);
  }, [isSignedIn, router, toast]);
  
  // Load shipping address and check for PayPal return
  useEffect(() => {
    // Skip if auth check hasn't completed or user isn't signed in
    if (!authChecked || !isSignedIn) return;
    
    // Check if shipping address exists
    const savedAddress = localStorage.getItem("shippingAddress");
    if (!savedAddress) {
      toast({
        title: "Missing shipping information",
        description: "Please provide your shipping details before proceeding to payment.",
        variant: "destructive",
      });
      router.push("/store/checkout/shipping");
      return;
    }
    
    try {
      setShippingAddress(JSON.parse(savedAddress));
    } catch (error) {
      console.error("Error parsing shipping address:", error);
      toast({
        title: "Error loading shipping information",
        description: "Please try again.",
        variant: "destructive",
      });
      router.push("/store/checkout/shipping");
    }
    
    // Check if returning from PayPal
    const token = searchParams?.get('token');
    if (token) {
      console.log('Detected return from PayPal with token:', token);
      handlePayPalReturn();
    }
  }, [router, searchParams, toast, authChecked, isSignedIn]);
  
  // Create a PayPal order via the API
  const createPayPalOrder = async () => {
    try {
      setIsSubmitting(true);
      setPaypalError(null);
      
      if (!shippingAddress) {
        throw new Error("Shipping address is required");
      }
      
      // Ensure the shipping address has all required fields
      if (!shippingAddress.fullName || !shippingAddress.streetAddress || 
          !shippingAddress.city || !shippingAddress.postalCode) {
        throw new Error("Incomplete shipping address");
      }
      
      // Calculate the total in INR
      const cartTotal = getCartTotal();
      
      // Convert to USD (fixed rate for demo)
      const exchangeRate = 0.012; // 1 INR = 0.012 USD (fixed for demo)
      const amountUSD = parseFloat((cartTotal * exchangeRate).toFixed(2));
      
      console.log(`Converting ${cartTotal} INR to USD: ${amountUSD} USD`);
      
      // Create line items for PayPal
      const items = cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        currency: "INR"
      }));
      
      // Make API request to create PayPal order
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          amount: amountUSD,
          cartTotal,
          shippingAddress
        }),
      });
      
      // Get response as text first to help with debugging
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse PayPal API response:', responseText);
        throw new Error(`Invalid response from PayPal API: ${responseText}`);
      }
      
      if (!response.ok) {
        console.error('PayPal order creation failed:', data);
        
        // Try to extract a more specific error message
        let errorMessage = 'Failed to create PayPal order';
        
        if (data && data.error) {
          errorMessage = data.error;
        } else if (data && data.details && Array.isArray(data.details) && data.details.length > 0) {
          // Handle detailed PayPal API errors
          errorMessage = data.details.map((detail: any) => detail.issue || detail.description).join('; ');
        } else if (data && data.message) {
          errorMessage = data.message;
        } else if (responseText && responseText.includes('Client Authentication failed')) {
          errorMessage = 'PayPal authentication failed. Please check your PayPal API credentials.';
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('PayPal order created:', data);
      
      // Find the approval link
      let approvalLink = null;
      if (data.links) {
        const approvalLinkObj = data.links.find((link: any) => link.rel === 'approve');
        if (approvalLinkObj) {
          approvalLink = approvalLinkObj.href;
        }
      }
      
      if (!approvalLink && !data.id) {
        throw new Error('No approval link or order ID found in PayPal response');
      }
      
      let orderResponse;
      
      if (!approvalLink) {
        // This is a fallback in case the API doesn't return the expected links
        const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.id}`;
        
        orderResponse = {
          id: data.id,
          status: data.status || 'CREATED',
          paymentUrl: paypalUrl
        };
        
        console.log('Created PayPal order with fallback URL:', orderResponse);
      } else {
        // Create an order object with the approval link
        orderResponse = {
          id: data.id,
          status: data.status,
          paymentUrl: approvalLink
        };
        
        console.log('Created PayPal order with API URL:', orderResponse);
      }
      
      // Update the state with the new order
      setPaypalOrder(orderResponse);
      
      // Return the order response so the caller can use it immediately
      return orderResponse;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      setPaypalError(error instanceof Error ? error.message : 'Failed to create PayPal order');
      setPaymentStatus('error');
      
      toast({
        title: "PayPal Error",
        description: error instanceof Error ? error.message : "Failed to create PayPal order",
        variant: "destructive",
      });
      
      throw error; // Re-throw so the caller knows there was an error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle PayPal payment completion
  const handlePayPalReturn = async () => {
    try {
      setIsSubmitting(true);
      setPaypalError(null);
      
      // Get the token from the URL
      const token = searchParams?.get('token');
      const payerId = searchParams?.get('PayerID');
      
      if (!token) {
        throw new Error('No payment token found');
      }
      
      console.log('🔍 Processing PayPal payment with token:', token, 'PayerID:', payerId);
      
      // Try to capture the payment via our API
      let captureSuccessful = false;
      try {
        console.log('🔍 Attempting to capture PayPal payment...');
        const captureResponse = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderID: token }),
        });
        
        if (captureResponse.ok) {
          const captureData = await captureResponse.json();
          console.log('✅ PayPal payment captured successfully:', captureData);
          captureSuccessful = true;
        } else {
          const errorData = await captureResponse.json().catch(() => ({}));
          console.warn('⚠️ Could not capture PayPal payment:', errorData);
          console.warn('Will continue with order process anyway');
        }
      } catch (captureError) {
        console.warn('❌ Error capturing PayPal payment:', captureError);
        // Continue with order process even if capture fails
      }
      
      // Create payment details object to pass to the confirmation page
      const paymentDetails = {
        id: token,
        status: 'completed',
        provider: 'paypal',
        timestamp: new Date().toISOString(),
        amount: getCartTotal(),
        currency: 'INR',
        payerId: payerId || 'unknown',
        captureSuccessful
      };
      
      console.log('🔍 Saving payment details to localStorage:', paymentDetails);
      
      // Save payment method and details to localStorage
      localStorage.setItem('paymentMethod', 'paypal');
      localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
      
      // Save shipping address again to ensure it's available
      const savedAddress = localStorage.getItem("shippingAddress");
      if (savedAddress) {
        // Re-save it to ensure it's fresh in localStorage
        localStorage.setItem("shippingAddress", savedAddress);
      }
      
      // Update order status
      setPaymentStatus('success');
      
      // Show success message
      toast({
        title: "Payment Successful",
        description: "Your PayPal payment was processed successfully!",
        variant: "default",
      });
      
      // Create the order directly here
      let orderCreated = false;
      let createdOrderId = null;
      
      if (!isSignedIn || !user || !user.id) {
        console.warn('⚠️ User not signed in or no user ID, cannot create order automatically');
      } else {
        try {
          console.log('🔍 Creating order directly after PayPal payment...');
          
          // Prepare order items
          const orderItems = cart.map((item) => ({
            productId: String(item.product.id),
            quantity: Number(item.quantity),
          }));
          
          // Calculate total
          const total = getCartTotal();
          
          // Get shipping address
          const shippingAddressData = savedAddress ? JSON.parse(savedAddress) : {};
          
          // Create the order via API
          const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: String(user.id),
              products: orderItems,
              status: "processing", // Set to processing since payment is completed
              total,
              shippingAddress: shippingAddressData,
              paymentMethod: 'paypal',
              paymentStatus: 'completed',
              paymentDetails
            }),
          });
          
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            console.log('✅ Order created successfully:', orderData);
            orderCreated = true;
            
            if (orderData.order && orderData.order.id) {
              createdOrderId = orderData.order.id;
              
              // Store the order items before clearing the cart
              const orderItems = cart.map(item => ({
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  description: item.product.description || ''
                },
                quantity: item.quantity
              }));
              
              // Save order items to localStorage for invoice generation
              localStorage.setItem('lastOrderItems', JSON.stringify(orderItems));
              localStorage.setItem('lastOrderTotal', String(getCartTotal()));
            }
            
            // Clear cart since order is now created
            clearCart();
            
            // Show another success message
            toast({
              title: "Order Placed Successfully",
              description: "Your order has been created and is being processed!",
            });
            
            // Send invoice email
            if (user?.emailAddresses && user.emailAddresses.length > 0) {
              try {
                // Get the customer email from the user's account
                const customerEmail = user.emailAddresses[0].emailAddress;
                console.log('Customer email from Clerk:', customerEmail);
                
                // Ensure we're using the correct email address
                // Get the email from the shipping address if available
                const emailToUse = shippingAddress?.email || customerEmail;
                console.log('Using email for invoice:', emailToUse);
                
                // Create invoice data
                const invoiceOrder = {
                  id: createdOrderId,
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
                  shippingAddress: shippingAddress,
                  paymentMethod: 'paypal',
                  paymentStatus: 'completed'
                };
                
                // Send the invoice email
                const emailResponse = await fetch('/api/email/send-invoice', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    order: invoiceOrder,
                    customerEmail: emailToUse
                  }),
                });
                
                const emailResult = await emailResponse.json();
                
                if (emailResponse.ok) {
                  console.log('✅ Invoice email sent successfully', emailResult);
                  
                  toast({
                    title: "Invoice Sent",
                    description: `We've sent your invoice to ${emailToUse}`,
                  });
                } else {
                  console.error(' Failed to send invoice email');
                }
              } catch (emailError) {
                console.error('Error sending invoice email:', emailError);
              }
            }
          } else {
            const errorData = await orderResponse.json().catch(() => ({}));
            console.error(' Failed to create order:', errorData);
            
            toast({
              title: "Order Creation Failed",
              description: "Your payment was successful, but we couldn't create your order. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (orderError) {
          console.error('Error creating order after PayPal payment:', orderError);
          
          toast({
            title: "Order Creation Error",
            description: "There was an error creating your order. Please contact support.",
            variant: "destructive",
          });
        }
      }
      
      // Store order creation status in localStorage
      localStorage.setItem('orderAlreadyCreated', orderCreated ? 'true' : 'false');
      if (createdOrderId) {
        localStorage.setItem('orderId', createdOrderId);
        setOrderId(createdOrderId);
      }
      
      // Show the order confirmation section instead of redirecting
      setPaymentStatus(orderCreated ? 'success' : 'error');
      
      // Clear cart if order was created
      if (orderCreated) {
        // Clear checkout data except what we need for display
        setTimeout(() => {
          localStorage.removeItem("paymentMethod");
          localStorage.removeItem("paymentDetails");
          localStorage.removeItem("orderAlreadyCreated");
        }, 2000); // Delay to ensure we don't need this data anymore
      }
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      setPaypalError(error instanceof Error ? error.message : 'Failed to process payment');
      setPaymentStatus('error');
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle payment method selection
  const handlePaymentSelect = (value: "paypal" | "cash_on_delivery") => {
    setSelectedPaymentMethod(value);
    setPaypalOrder(null);
    setPaypalError(null);
  };
  
  // Handle continue button click
  const handleCashOnDelivery = () => {
    if (selectedPaymentMethod === "cash_on_delivery") {
      // Save payment method to localStorage
      localStorage.setItem("paymentMethod", "cash_on_delivery");
      
      // Redirect to confirmation page
      router.push("/store/checkout/confirmation");
    } else {
      // For PayPal, create an order
      createPayPalOrder();
    }
  };
  
  // Handle PayPal checkout button click
  const handlePayPalCheckout = async () => {
    toast({
      title: "Please use these credentials for payment",
      description: (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div><strong>userid:</strong> souravbudke@personal.example.com </div>
              <div><strong>pass:</strong> souravbudke </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Copy credentials"
                    className="ml-4 cursor-pointer p-1 rounded hover:bg-accent focus:bg-accent transition-colors"
                    onClick={async () => {
                      const credentials = `userid: souravbudke@personal.example.com \npass: souravbudke`;
                      let copied = false;
                      if (navigator.clipboard && window.isSecureContext) {
                        try {
                          await navigator.clipboard.writeText(credentials);
                          copied = true;
                        } catch {}
                      }
                      if (!copied) {
                        // fallback for mobile/unsupported
                        const textarea = document.createElement("textarea");
                        textarea.value = credentials;
                        textarea.style.position = "fixed";
                        textarea.style.left = "-9999px";
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();
                        try {
                          document.execCommand("copy");
                          copied = true;
                        } catch {}
                        document.body.removeChild(textarea);
                      }
                      toast({
                        title: "Copied!",
                        description: "Credentials copied to clipboard",
                        duration: 2000,
                      });
                    }}
                  >
                    <ClipboardCopy className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Copy credentials</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ),
      variant: "default",
      duration: 10000,
    });
    try {
      setIsSubmitting(true);
      
      // Try direct PayPal order creation
      try {
        // Create the PayPal order and get the response directly
        const order = await createPayPalOrder();
        
        if (order && order.paymentUrl) {
          console.log('Redirecting to PayPal checkout URL immediately:', order.paymentUrl);
          window.location.href = order.paymentUrl;
          return; // Exit early if successful
        }
      } catch (apiError) {
        console.error('Error with API order creation:', apiError);
        // Continue with fallback below
        
        setPaypalError(`API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
        toast({
          title: "PayPal API Error",
          description: apiError instanceof Error ? apiError.message : "Unknown API error",
          variant: "destructive",
        });
      }
      
      // Fallback to the state value if direct return doesn't work
      if (paypalOrder && paypalOrder.paymentUrl) {
        setTimeout(() => {
          console.log('Redirecting to PayPal checkout URL (from state):', paypalOrder.paymentUrl);
          window.location.href = paypalOrder.paymentUrl;
        }, 1000);
      } else {
        // Last resort fallback - show a button to manually go to PayPal
        console.error('No PayPal order or payment URL available');
        setPaypalError('We had trouble connecting to PayPal. You can try completing your payment through our cash on delivery option.');
        toast({
          title: "PayPal Connection Issue",
          description: "We're having trouble connecting to PayPal. You can try again or select cash on delivery.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error during PayPal checkout:', error);
      setPaypalError(error instanceof Error ? error.message : 'Failed to process PayPal checkout');
      
      toast({
        title: "PayPal Error",
        description: error instanceof Error ? error.message : "Failed to process PayPal checkout",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  return (
    <AuthGuard>
      <div className="container max-w-4xl py-6 sm:py-8 px-4 sm:px-6 mx-auto flex flex-col items-center justify-center">
        {/* Only show breadcrumbs when not in success state */}
        {!(paymentStatus === 'success' && orderId) && (
          <div className="w-full max-w-2xl mb-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-purple-600 mb-2">
              Checkout
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
                  <span className="text-xs">3</span>
                </div>
                <span className="text-xs md:text-sm font-medium dark:text-white">Payment</span>
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                  <span className="text-xs">4</span>
                </div>
                <span className="text-xs md:text-sm dark:text-gray-300">Confirmation</span>
              </div>
            </div>
          </div>
        )}
        {/* Show order confirmation if payment was successful and order was created */}
        {paymentStatus === 'success' && orderId ? (
          <Card className="w-full max-w-2xl shadow-md mx-auto">
            <CardHeader className="text-center bg-primary/5 rounded-t-lg relative pb-14 sm:pb-8">
              <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => {
                    // Get stored order items from localStorage
                    const storedItems = localStorage.getItem('lastOrderItems');
                    const storedTotal = localStorage.getItem('lastOrderTotal');
                    
                    // Create invoice data using stored information
                    const invoiceData = {
                      id: orderId,
                      createdAt: new Date().toISOString(),
                      items: storedItems ? JSON.parse(storedItems) : [],
                      total: storedTotal ? parseFloat(storedTotal) : 0,
                      shippingAddress: shippingAddress,
                      paymentMethod: 'paypal',
                      paymentStatus: 'completed'
                    };
                    
                    downloadInvoice(invoiceData);
                  }}
                  size="sm"
                  variant="secondary" 
                  className="flex items-center justify-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Invoice
                </Button>
                <Button 
                  onClick={() => {
                    // Get stored order items from localStorage
                    const storedItems = localStorage.getItem('lastOrderItems');
                    const storedTotal = localStorage.getItem('lastOrderTotal');
                    
                    // Create invoice data using stored information
                    const invoiceData = {
                      id: orderId,
                      createdAt: new Date().toISOString(),
                      items: storedItems ? JSON.parse(storedItems) : [],
                      total: storedTotal ? parseFloat(storedTotal) : 0,
                      shippingAddress: shippingAddress,
                      paymentMethod: 'paypal',
                      paymentStatus: 'completed'
                    };
                    
                    printInvoice(invoiceData);
                  }}
                  size="sm"
                  variant="outline" 
                  className="flex items-center justify-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print
                </Button>
              </div>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-14 w-14 sm:h-16 sm:w-16 text-green-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Order Successful!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 px-4 sm:px-6">
              <p className="text-muted-foreground text-sm sm:text-base">
                Thank you for your purchase. Your order has been successfully placed and is being processed.
              </p>
              
              <p className="font-medium text-sm sm:text-base text-foreground">
                Order ID: <span className="font-bold break-all">{orderId}</span>
              </p>
              
              <p className="text-muted-foreground text-sm sm:text-base">
                You will receive an email confirmation shortly please check Spam folder in mail.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-6 justify-center">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/store/account">My Account</Link>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/store">Continue Shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-2xl shadow-md mx-auto">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-2xl font-bold text-foreground">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Show loading state while checking PayPal return */}
              {isSubmitting && (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-center text-muted-foreground">
                    Processing your payment...
                  </p>
                </div>
              )}
              
              {/* Show error message if PayPal payment failed */}
              {paypalError && !isSubmitting && (
                <div className="bg-destructive/15 p-4 rounded-md mb-6">
                  <p className="text-destructive font-medium">Payment Error</p>
                  <p className="text-sm">{paypalError}</p>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground">
                      You can try again or select Cash on Delivery to complete your order.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Show payment form if not submitting */}
              {!isSubmitting && !paypalError && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <RadioGroup
                      defaultValue={selectedPaymentMethod}
                      value={selectedPaymentMethod}
                      onValueChange={(value) => setSelectedPaymentMethod(value as "paypal" | "cash_on_delivery")}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="flex items-center cursor-pointer w-full">
                          <span className="mr-2 font-medium text-foreground">PayPal</span>
                          <span className="text-blue-600 text-sm ml-1">(Pay securely online)</span>
                          <div className="ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="20" viewBox="0 0 124 33" className="h-6 w-auto">
                              <path fill="#253B80" d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.97-1.142-2.694-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/>
                              <path fill="#179BD7" d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/>
                            </svg>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors mt-3">
                        <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                        <Label htmlFor="cash_on_delivery" className="flex items-center cursor-pointer w-full">
                          <span className="font-medium text-foreground">Cash on Delivery</span>
                          <span className="text-muted-foreground text-sm ml-1">(Pay when you receive)</span>
                          <div className="ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                              <rect width="20" height="12" x="2" y="6" rx="2"/>
                              <circle cx="12" cy="12" r="2"/>
                              <path d="M6 12h.01M18 12h.01"/>
                            </svg>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <h3 className="font-medium text-foreground">Shipping Address</h3>
                    {shippingAddress && (
                      <div className="text-sm space-y-1 p-3 sm:p-4 border rounded-md bg-accent/20">
                        <p className="font-medium text-foreground">{shippingAddress.fullName}</p>
                        <p className="break-words text-foreground">{shippingAddress.streetAddress}</p>
                        <p className="text-foreground">
                          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                        </p>
                        <p className="text-foreground">{shippingAddress.country}</p>
                        <p className="mt-2 text-muted-foreground">Phone: {shippingAddress.phone}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <h3 className="font-medium text-foreground">Order Summary</h3>
                    <div className="space-y-2 p-3 sm:p-4 border rounded-md">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-start py-2">
                          <div className="flex items-start max-w-[70%]">
                            <span className="inline-flex items-center justify-center bg-primary/20 text-primary w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 text-xs flex-shrink-0 mt-0.5">
                              {item.quantity}
                            </span>
                            <span className="break-words text-foreground">{item.product.name}</span>
                          </div>
                          <span className="font-medium ml-2 flex-shrink-0 text-foreground">{formatCurrency(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                      <Separator className="my-3" />
                      <div className="flex justify-between font-medium text-base sm:text-lg pt-2">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{formatCurrency(getCartTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t mt-4 justify-center">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={() => router.push('/store/checkout/shipping')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shipping
              </Button>
              
              {/* For Cash on Delivery, show Place Order button */}
              {selectedPaymentMethod === "cash_on_delivery" && (
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleCashOnDelivery}
                  disabled={isSubmitting || !shippingAddress || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              )}
              
              {/* For PayPal, either show Checkout button or Complete Payment button */}
              {selectedPaymentMethod === "paypal" && !paypalOrder && (
                <Button
                  className="w-full sm:w-auto bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium"
                  onClick={handlePayPalCheckout}
                  disabled={isSubmitting || !shippingAddress || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Proceed to PayPal
                    </>
                  )}
                </Button>
              )}
              
              {/* Show PayPal redirect button if we have a PayPal order */}
              {paypalOrder && (
                <Button
                  className="w-full sm:w-auto bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium shadow-md"
                  onClick={() => {
                    // Directly use the URL from state instead of using the handler function
                    console.log('Redirecting directly to PayPal from button click:', paypalOrder.paymentUrl);
                    window.location.href = paypalOrder.paymentUrl;
                  }}
                >
                  Complete Payment with PayPal
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}

// Wrap the component with Suspense to fix the build error with useSearchParams()
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container py-10 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2 text-foreground">Loading payment page...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
