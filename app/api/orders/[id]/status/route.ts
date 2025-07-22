import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import connectDB from "@/lib/mongodb"
import { Order } from "@/lib/db"

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await connectDB(); // Ensure connection is established
    
    // Get the ID from params
    const { id } = await params;
    
    // Check if we need to filter by userId
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      console.log(`GET /api/orders: Fetching orders for user ${userId}`);
      // Use the getUserOrders method - we check if it exists on the db object first
      if ('getUserOrders' in db) {
        // Type assertion to inform TypeScript this method exists
        const userOrders = await (db as any).getUserOrders(userId);
        console.log(`GET /api/orders: Found ${userOrders.length} orders for user ${userId}`);
        return NextResponse.json(userOrders);
      } else {
        // Fallback if method doesn't exist
        const orders = await db.getOrders() as Order[];
        const userOrders = orders.filter(order => order.userId === userId);
        console.log(`GET /api/orders: Found ${userOrders.length} orders for user ${userId}`);
        return NextResponse.json(userOrders);
      }
    } else {
      console.log('GET /api/orders: Fetching all orders');
      const orders = await db.getOrders();
      console.log(`GET /api/orders: Found ${orders.length} orders`);
      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // Get the ID from params
    const { id } = await params;
    
    const body = await request.json();
    
    // Log request body for debugging
    console.log('POST /api/orders - Processing order request:', JSON.stringify(body));
    
    // Validate required fields
    if (!body.userId || !Array.isArray(body.products) || body.products.length === 0) {
      console.error("Missing required fields:", { userId: body.userId, products: body.products });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Ensure products are in the correct format
    const formattedProducts = body.products.map((item: any) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity) || 1
    }));
    
    let orderTotal = 0;
    const productsToUpdate = [];
    
    try {
      // Ensure database connection is established
      await connectDB();
      
      // Validate that all products exist and calculate total
      console.log("Verifying products and calculating total...");
      
      for (const item of formattedProducts) {
        const product = await db.getProduct(item.productId);
        
        if (!product) {
          console.error(`Product not found: ${item.productId}`);
          return NextResponse.json({ 
            error: `Product ${item.productId} not found` 
          }, { status: 404 });
        }
        
        // Check if we have enough stock
        if (product.stock < item.quantity) {
          console.error(`Not enough stock for product ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`);
          return NextResponse.json({
            error: `Not enough stock for product ${product.name}. Only ${product.stock} units available.`
          }, { status: 400 });
        }
        
        console.log(`Product verified: ${product.name}, price: ${product.price}, quantity: ${item.quantity}`);
        orderTotal += product.price * item.quantity;
        
        // Store product info for stock update later
        productsToUpdate.push({
          id: product.id,
          name: product.name,
          currentStock: product.stock,
          orderQuantity: item.quantity
        });
      }
      
      console.log(`Order total calculated: ${orderTotal}`);
    } catch (error) {
      console.error("Error validating products:", error);
      return NextResponse.json({ 
        error: "Error validating products", 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }
    
    // Prepare the order object with shipping and payment details
    const orderData = {
      userId: String(body.userId),
      products: formattedProducts,
      status: body.status || "pending",
      total: body.total || orderTotal,
      // Add shipping address if provided
      shippingAddress: body.shippingAddress || undefined,
      // Add payment information
      paymentMethod: body.paymentMethod || "cash_on_delivery",
      paymentStatus: body.paymentStatus || "pending",
      paymentDetails: body.paymentDetails || undefined
    };
    
    console.log('Creating order with data:', JSON.stringify(orderData));
    
    try {
      // Create the order - use type assertion with proper interface
      const createOrder = (db as any).createOrder;
      const order = await createOrder(orderData);
      console.log('Order created successfully:', order.id);
      
      // Update product stock after successful order creation
      console.log('Updating product stock...');
      
      const stockUpdatePromises = productsToUpdate.map(async (product) => {
        const newStock = Math.max(0, product.currentStock - product.orderQuantity);
        console.log(`Updating stock for ${product.name}: ${product.currentStock} -> ${newStock}`);
        
        try {
          await db.updateProduct(product.id, { stock: newStock });
          return { success: true, productId: product.id };
        } catch (updateError) {
          console.error(`Failed to update stock for product ${product.id}:`, updateError);
          return { success: false, productId: product.id, error: updateError };
        }
      });
      
      // Wait for all stock updates to complete
      const stockUpdateResults = await Promise.all(stockUpdatePromises);
      console.log('Stock update results:', stockUpdateResults);
      
      return NextResponse.json({
        success: true,
        message: "Order created successfully and stock updated",
        order
      }, { status: 201 });
    } catch (orderError) {
      console.error("Error creating order in database:", orderError);
      return NextResponse.json({ 
        error: "Failed to create order in database", 
        details: orderError instanceof Error ? orderError.message : String(orderError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing order request:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Await params before destructuring
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate status is provided
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
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
    
    // Find the order first
    await connectDB();
    const order = await db.getOrder(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Update the order status
    // Use type assertion to handle the updateOrderStatus method
    const updatedOrder = await (db as any).updateOrderStatus(id, body.status);
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}