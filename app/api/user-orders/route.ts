import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import connectDB from "@/lib/mongodb";
import { Order } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Fetch orders from database for the current user
    console.log(`Fetching orders for user ${userId}`);
    const userOrders = await db.getUserOrders(userId);
    console.log(`Found ${userOrders.length} orders for user ${userId}`);
    
    // Return the orders
    return NextResponse.json(userOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
