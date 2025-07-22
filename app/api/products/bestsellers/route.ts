import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBestSellingProducts } from "@/lib/utils";

// Set cache control headers for this route
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: Request) {
  try {
    // Get limit from query parameters (default to 8)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "8", 10);
    
    // Fetch products and orders
    const allProducts = await db.getProducts();
    const allOrders = await db.getOrders();
    
    console.log(`Fetching bestsellers: ${allProducts.length} products, ${allOrders.length} orders`);
    
    // Get best-selling products
    const bestSellerProducts = getBestSellingProducts(allOrders, allProducts, limit);
    
    // Return the bestseller products
    return NextResponse.json({ 
      products: bestSellerProducts,
      timestamp: new Date().toISOString() 
    }, { 
      status: 200,
      headers: {
        // Set cache control headers
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error("Error fetching bestseller products:", error);
    return NextResponse.json({ error: "Failed to fetch bestseller products" }, { status: 500 });
  }
}
