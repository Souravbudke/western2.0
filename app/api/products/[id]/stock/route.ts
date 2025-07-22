import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Helper function to safely extract the ID parameter
async function getParamId(params: any): Promise<string> {
  const resolvedParams = await Promise.resolve(params);
  return String(resolvedParams?.id || "");
}

// Route params interface to help TypeScript understand the parameters
interface RouteParams {
  params: {
    id: string;
  }
}

// GET endpoint to fetch current stock information for a product
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const id = await getParamId(params);
    
    // Validate ID
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    
    // Get product from database
    const product = await db.getProduct(id);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    // Return only the stock information
    return NextResponse.json({
      id: product.id,
      stock: product.stock,
      available: product.stock > 0
    });
  } catch (error) {
    console.error(`Error fetching stock for product ${params?.id}:`, error);
    return NextResponse.json({ 
      error: "Failed to fetch product stock",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 