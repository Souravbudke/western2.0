import { NextResponse, NextRequest } from "next/server"
import { db, Review } from "@/lib/db"
import mongoose from "mongoose"

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

// GET endpoint to fetch reviews for a product
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const id = await getParamId(params);
    
    // Validate ID
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Make sure product exists
    const product = await db.getProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch reviews for the product
    const reviews = await db.getProductReviews(id);

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((total: number, review: Review) => total + review.rating, 0);
      averageRating = sum / reviews.length;
    }

    return NextResponse.json({
      reviews,
      count: reviews.length,
      averageRating
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ 
      error: "Failed to fetch reviews",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// POST endpoint to create a new review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get product ID first
    const id = await getParamId(params);
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Parse the request body - only do this once
    let body;
    try {
      // Clone the request to avoid "body already used" errors
      const clonedRequest = request.clone();
      body = await clonedRequest.json();
    } catch (parseError) {
      return NextResponse.json({ 
        error: "Invalid request body", 
        details: "Could not parse JSON request body" 
      }, { status: 400 });
    }
    
    // Extract data from request body
    const { rating, comment, userName } = body;
    
    // For authentication, we'll use the user ID from the client
    const userId = body.userId || (body.user?.id);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    // Validate required fields
    if (!rating || !comment) {
      return NextResponse.json({ 
        error: "Rating and comment are required" 
      }, { status: 400 });
    }

    // Validate rating
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ 
        error: "Rating must be a number between 1 and 5" 
      }, { status: 400 });
    }

    // Make sure product exists - use a more efficient check
    const product = await db.getProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create or update the review
    const displayName = userName || "Anonymous";
    
    try {
      // Use a more efficient approach to create the review
      const review = await db.createReview(
        id,
        userId,
        displayName,
        numericRating,
        comment,
        true // Assuming all reviews from logged-in users are verified for this demo
      );

      if (!review) {
        return NextResponse.json({ 
          error: "Failed to create review" 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: "Review processed successfully",
        review
      }, { status: 201 });
    } catch (createError) {
      return NextResponse.json({ 
        error: "Failed to create review",
        details: createError instanceof Error ? createError.message : "Unknown error during review creation"
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to process review",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

