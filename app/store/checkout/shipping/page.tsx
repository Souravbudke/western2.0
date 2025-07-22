"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-provider";
import { formatCurrency } from "@/lib/utils";

// Form schema for validation
const shippingFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  streetAddress: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

export default function ShippingPage() {
  const router = useRouter();
  const { cart, getCartTotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fullName: "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: ShippingFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Store shipping details in localStorage or a state manager
      localStorage.setItem("shippingAddress", JSON.stringify(values));
      
      // Redirect to payment page
      router.push("/store/checkout/payment");
    } catch (error) {
      console.error("Error saving shipping address:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If cart is empty, redirect to cart page
  if (cart.length === 0) {
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
  
  return (
    <AuthGuard>
      <div className="container mx-auto py-10">
        <div className="mb-6">
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
                <span className="text-xs">2</span>
              </div>
              <span className="text-xs md:text-sm font-medium dark:text-white">Shipping</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                <span className="text-xs">3</span>
              </div>
              <span className="text-xs md:text-sm dark:text-gray-300">Payment</span>
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
              <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                <span className="text-xs">4</span>
              </div>
              <span className="text-xs md:text-sm dark:text-gray-300">Confirmation</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 123 456 7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="streetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Hubballi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="Karnataka" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="580031" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="India" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => router.push("/store/cart")}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cart
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
                      >
                        {isSubmitting ? "Saving..." : "Continue"}
                        {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex items-start max-w-[70%]">
                      <div className="mr-2 font-medium flex-shrink-0">{item.quantity}x</div>
                      <div className="break-words">{item.product.name}</div>
                    </div>
                    <div className="ml-2 flex-shrink-0">{formatCurrency(item.product.price * item.quantity)}</div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(getCartTotal())}</span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 