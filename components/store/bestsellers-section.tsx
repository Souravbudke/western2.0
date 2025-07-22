"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award } from "lucide-react";
import ProductCard from "@/components/store/product-card";
import { Skeleton } from "@/components/ui/skeleton";

// Product interface definition
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export function BestsellersSection({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Fetch bestseller products
  const fetchBestsellers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add cache-busting timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products/bestsellers?limit=8&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch bestseller products");
      }
      
      const data = await response.json();
      setProducts(data.products);
      console.log("Updated bestsellers at:", data.timestamp);
    } catch (err) {
      console.error("Error fetching bestsellers:", err);
      setError("Failed to load bestseller products");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch bestsellers on component mount and page refresh
  useEffect(() => {
    // Always fetch on mount to ensure fresh data
    fetchBestsellers();
    
    // Set up interval to refresh bestsellers every 5 minutes
    const intervalId = setInterval(() => {
      fetchBestsellers();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Add event listener for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when page becomes visible again (e.g., after tab switch or refresh)
        fetchBestsellers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up interval and event listener on component unmount
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div className="space-y-3">
            <Badge variant="outline" className="border-border bg-background/80 text-foreground">
              <Award className="mr-1 h-3.5 w-3.5 text-foreground" />
              Best Sellers
            </Badge>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl text-foreground">Most Popular Products</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Our customers' favorites and most frequently purchased sneakers products
            </p>
          </div>
          <Link href="/store/products" className="mt-4 md:mt-0">
            <Button variant="link" className="gap-1 text-foreground hover:text-foreground/80">
              View All Products <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="text-center p-4 mb-6 text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : products.length > 0 ? (
            // Product cards
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                isBestSeller={true} 
              />
            ))
          ) : (
            // No products found
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No bestseller products found.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
