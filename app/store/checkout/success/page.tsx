"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if we have an order ID in localStorage
    const savedOrderId = localStorage.getItem("orderId");
    if (savedOrderId) {
      setOrderId(savedOrderId);
      // Clear it after retrieving
      localStorage.removeItem("orderId");
    }
    
    // Clear any remaining checkout data
    localStorage.removeItem("shippingAddress");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("paymentDetails");
    localStorage.removeItem("orderAlreadyCreated");
    
    // Show success toast
    toast({
      title: "Order Completed",
      description: "Thank you for your purchase!",
    });
  }, [toast]);
  
  return (
    <div className="container max-w-4xl py-8 px-4 sm:px-6 mx-auto flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Order Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 px-4 sm:px-6">
          <p className="text-muted-foreground text-sm sm:text-base">
            Thank you for your purchase. Your order has been successfully placed and is being processed.
          </p>
          
          {orderId && (
            <p className="font-medium">
              Order ID: <span className="font-bold">{orderId}</span>
            </p>
          )}
          
          <p className="text-muted-foreground text-sm sm:text-base">
            You will receive an email confirmation shortly.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t mt-4">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/store/account">My Account</Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/store">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
