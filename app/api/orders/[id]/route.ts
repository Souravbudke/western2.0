import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import connectDB from "@/lib/mongodb"

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    await connectDB(); // Ensure connection is established
    
    // Extract ID parameter properly
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const order = await db.getOrder(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update an order (primarily for status updates)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Extract ID parameter properly
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Find the order first
    await connectDB(); // Ensure connection is established
    const order = await db.getOrder(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // For now, we only support updating the status
    if (!body.status) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Validate status is one of the allowed values
    const validStatuses = ["pending", "processing", "shipped", "delivered"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Update the order status
    const updatedOrder = await db.updateOrderStatus(id, body.status);
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Extract ID parameter properly
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the order exists
    await connectDB(); // Ensure connection is established
    const order = await db.getOrder(id);
    
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Delete the order using the deleteOrder method
    const deleted = await db.deleteOrder(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete order" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}