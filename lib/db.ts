// This is a mock database for demonstration purposes
// In a real application, you would use a real database like PostgreSQL with Prisma or Supabase

import connectDB from './mongodb';
import mongoose from 'mongoose';
import { Document, HydratedDocument, Model } from 'mongoose';

// Check if we're running on the server
const isServer = typeof window === 'undefined';

// Type definitions for dynamic imports
type ProductModelType = Model<ProductDocument>;
type UserModelType = Model<UserDocument>; 
type OrderModelType = Model<OrderDocument>;
type CategoryModelType = Model<CategoryDocument>;
type ReviewModelType = Model<ReviewDocument>;

// Type definitions for client-side code
export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  imageCid?: string; // Optional field to store Pinata CID
  stock: number;
  reviews?: Review[];
  averageRating?: number;
}

export type Category = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Order = {
  id: string;
  userId: string;
  products: { productId: string; quantity: number }[];
  status: "pending" | "processing" | "shipped" | "delivered";
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  createdAt: string;
  shippingAddress?: {
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod?: "paypal" | "cash_on_delivery";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentDetails?: any;
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  clerkId?: string; // Optional Clerk user ID
}

// MongoDB Schema Types
export interface ProductDocument extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  imageCid?: string; // Optional field to store Pinata CID
  stock: number;
}

export interface CategoryDocument extends Document {
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderProductItem {
  productId: string;
  quantity: number;
}

export interface OrderDocument extends Document {
  userId: string;
  products: OrderProductItem[];
  status: "pending" | "processing" | "shipped" | "delivered";
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  createdAt: Date;
  shippingAddress?: {
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod?: "paypal" | "cash_on_delivery";
  paymentStatus?: "pending" | "completed" | "failed";
  paymentDetails?: any;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  role: "admin" | "customer";
  password: string;
  clerkId?: string; // Optional Clerk user ID
}

export interface ReviewDocument extends Document {
  productId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Fallback data in case of errors
const fallbackProducts: Product[] = [
  {
    id: "fallback-1",
    name: "Sample Product",
    description: "A sample product when database is unavailable.",
    price: 19.99,
    category: "Sample",
    image: "/placeholder.svg?height=300&width=300",
    stock: 10,
  }
];

const fallbackUsers: User[] = [
  {
    id: "fallback-1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: "fallback-2",
    name: "Customer User",
    email: "customer@example.com",
    role: "customer",
  }
];

const fallbackOrders: Order[] = [
  {
    id: "fallback-1",
    userId: "fallback-2",
    products: [
      { productId: "fallback-1", quantity: 1 }
    ],
    status: "delivered",
    total: 19.99,
    createdAt: new Date().toISOString(),
  }
];

// Helper functions to convert MongoDB documents to client-side types
function convertReview(doc: any): Review | null {
  if (!doc) return null;
  
  try {
    // Safely extract and convert the productId
    let productIdStr = '';
    if (doc.productId) {
      if (typeof doc.productId === 'string') {
        productIdStr = doc.productId;
      } else if (doc.productId.toString) {
        // Handle ObjectId or other objects with toString method
        productIdStr = doc.productId.toString();
      } else if (doc.productId._id) {
        // Handle case where productId might be an object with _id
        productIdStr = typeof doc.productId._id === 'string' 
          ? doc.productId._id 
          : doc.productId._id.toString();
      }
    }
    
    return {
      id: doc._id?.toString() || '',
      productId: productIdStr,
      userId: doc.userId || '',
      userName: doc.userName || '',
      rating: Number(doc.rating) || 0,
      comment: doc.comment || '',
      verified: Boolean(doc.verified),
      createdAt: doc.createdAt instanceof Date 
        ? doc.createdAt.toISOString() 
        : (typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()),
      updatedAt: doc.updatedAt instanceof Date 
        ? doc.updatedAt.toISOString() 
        : (typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString())
    };
  } catch (error) {
    console.error("Error converting review document:", error, "Document:", doc);
    return null;
  }
}

function convertProduct(doc: any): Product | null {
  if (!doc) return null;
  
  try {
    const reviews = Array.isArray(doc.reviews) 
      ? doc.reviews.map((reviewDoc: any) => convertReview(reviewDoc)).filter(Boolean)
      : [];
      
    // Calculate average rating if reviews exist
    let averageRating: number | undefined = undefined;
    if (reviews.length > 0) {
      const total = reviews.reduce((sum: number, review: Review | null) => sum + (review?.rating || 0), 0);
      averageRating = total / reviews.length;
    }
    
    return {
      id: doc._id?.toString(),
      name: doc.name || '',
      description: doc.description || '',
      price: doc.price || 0,
      category: doc.category || '',
      image: doc.image || '',
      imageCid: doc.imageCid || undefined,
      stock: doc.stock || 0,
      reviews: reviews.length > 0 ? reviews : undefined,
      averageRating
    };
  } catch (error) {
    console.error("Error converting product document:", error, "Document:", doc);
    return {
      id: doc._id?.toString(),
      name: doc.name || '',
      description: doc.description || '',
      price: doc.price || 0,
      category: doc.category || '',
      image: doc.image || '',
      imageCid: doc.imageCid || undefined,
      stock: doc.stock || 0
    };
  }
}

function convertOrder(doc: any): Order | null {
  if (!doc) return null;
  
  try {
    return {
      id: doc._id?.toString() || '',
      userId: typeof doc.userId === 'string' ? doc.userId : doc.userId?.toString() || '',
      products: Array.isArray(doc.products) 
        ? doc.products.map((p: any) => ({
            productId: typeof p.productId === 'string' ? p.productId : p.productId?.toString() || '',
            quantity: Number(p.quantity) || 0
          }))
        : [],
      status: doc.status || 'pending',
      total: Number(doc.total) || 0,
      subtotal: doc.subtotal ? Number(doc.subtotal) : undefined,
      shipping: doc.shipping ? Number(doc.shipping) : undefined,
      tax: doc.tax ? Number(doc.tax) : undefined,
      createdAt: doc.createdAt instanceof Date 
        ? doc.createdAt.toISOString() 
        : (typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()),
      shippingAddress: doc.shippingAddress || undefined,
      paymentMethod: doc.paymentMethod || undefined,
      paymentStatus: doc.paymentStatus || undefined,
      paymentDetails: doc.paymentDetails || undefined
    };
  } catch (error) {
    console.error("Error converting order document:", error, "Document:", doc);
    return null;
  }
}

function convertUser(doc: any): User | null {
  if (!doc) return null;
  return {
    id: doc._id?.toString(),
    name: doc.name || '',
    email: doc.email || '',
    role: doc.role || 'customer',
    clerkId: doc.clerkId || undefined
  };
}

function convertCategory(doc: any): Category | null {
  if (!doc) return null;
  
  try {
    return {
      id: doc._id?.toString() || '',
      name: doc.name || '',
      description: doc.description || '',
      slug: doc.slug || '',
      isActive: Boolean(doc.isActive),
      createdAt: doc.createdAt instanceof Date 
        ? doc.createdAt.toISOString() 
        : (typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString()),
      updatedAt: doc.updatedAt instanceof Date 
        ? doc.updatedAt.toISOString() 
        : (typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString())
    };
  } catch (error) {
    console.error("Error converting category document:", error, "Document:", doc);
    return null;
  }
}

// Create a server-side database interface
const serverDb = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    try {
      await connectDB();
      console.log('Fetching products from MongoDB...');
      // Import the model dynamically only on the server
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      const products = await ProductModel.find().lean();
      console.log(`Found ${products.length} products in MongoDB`);
      
      // Return converted products
      return products.map(product => convertProduct(product)).filter(Boolean) as Product[];
    } catch (error) {
      console.error('Error fetching products from MongoDB:', error);
      return fallbackProducts;
    }
  },
  
  getProduct: async (id: string): Promise<Product | null> => {
    try {
      await connectDB();
      console.log(`Fetching product ${id} from MongoDB...`);
      // Import the model dynamically only on the server
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      
      // Use the product model to find the product by ID
      const product = await ProductModel.findById(id).lean();
      
      if (!product) {
        console.log(`Product ${id} not found in MongoDB`);
        return null;
      }
      
      // Convert to our Product type which can have reviews
      const productData: any = { ...product };
      
      // For individual products, fetch reviews separately instead of using populate
      if (mongoose.Types.ObjectId.isValid(id)) {
        try {
          const { default: ReviewModel } = await import('./models/Review') as { default: ReviewModelType };
          const reviews = await ReviewModel.find({ 
            productId: new mongoose.Types.ObjectId(id)
          }).sort({ createdAt: -1 }).lean();
          
          // Add reviews to the product object
          productData.reviews = reviews;
        } catch (reviewError) {
          console.error(`Error fetching reviews for product ${id}:`, reviewError);
          // Continue without reviews if there's an error
        }
      }
      
      return convertProduct(productData);
    } catch (error) {
      console.error(`Error fetching product ${id} from MongoDB:`, error);
      return null;
    }
  },
  
  addProduct: async (product: Omit<Product, "id">): Promise<Product> => {
    try {
      await connectDB();
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      const newProduct = await ProductModel.create(product);
      const converted = convertProduct(newProduct);
      if (!converted) throw new Error("Failed to convert product");
      return converted;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },
  
  updateProduct: async (id: string, data: Partial<Product>): Promise<Product | null> => {
    try {
      await connectDB();
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id, 
        data, 
        { new: true }
      ).lean();
      
      return updatedProduct ? convertProduct(updatedProduct) : null;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },
  
  deleteProduct: async (id: string): Promise<boolean> => {
    try {
      await connectDB();
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      const result = await ProductModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    try {
      await connectDB();
      console.log('Fetching orders from MongoDB...');
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      const orders = await OrderModel.find().lean();
      console.log(`Found ${orders.length} orders in MongoDB`);
      
      const convertedOrders = orders.map((o: any) => {
        const converted = convertOrder(o);
        return converted ? converted : null;
      }).filter((o: any) => o !== null) as Order[];
      
      // Get user information for all orders
      const userIds = convertedOrders
        .map(order => order.userId)
        .filter(userId => userId) as string[];
      
      if (userIds.length > 0) {
        try {
          // Separate Clerk IDs from MongoDB ObjectIds
          const clerkIds = userIds.filter(id => id.startsWith('user_'));
          const mongoIds = userIds.filter(id => !id.startsWith('user_') && mongoose.Types.ObjectId.isValid(id));
          
          const userMap = new Map();
          
          // Get users with MongoDB ObjectIds
          if (mongoIds.length > 0) {
            const mongoUsers = await UserModel.find({ _id: { $in: mongoIds } }).lean();
            
            // Add MongoDB users to the map
            mongoUsers.forEach(user => {
              const convertedUser = convertUser(user);
              if (convertedUser && convertedUser.id) {
                userMap.set(convertedUser.id, convertedUser);
              }
            });
          }
          
          // Get users with Clerk IDs
          if (clerkIds.length > 0) {
            const clerkUsers = await UserModel.find({ clerkId: { $in: clerkIds } }).lean();
            
            // Add Clerk users to the map by their clerkId
            clerkUsers.forEach(user => {
              const convertedUser = convertUser(user);
              if (convertedUser && user.clerkId) {
                userMap.set(user.clerkId, convertedUser);
              }
            });
          }
          
          // Add user information to each order
          convertedOrders.forEach(order => {
            if (order.userId && userMap.has(order.userId)) {
              // @ts-ignore - Adding user field to order
              order.user = userMap.get(order.userId);
            }
          });
        } catch (userError) {
          console.error("Error fetching users for orders:", userError);
          // Continue even if user fetch fails
        }
      }
      
      console.log(`Converted ${convertedOrders.length} orders with user information`);
      return convertedOrders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return fallbackOrders;
    }
  },
  
  getUserOrders: async (userId: string): Promise<Order[]> => {
    try {
      await connectDB();
      console.log(`Fetching orders for user ${userId}...`);
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      
      let query = { userId };
      let orders = [];
      
      // First try direct match with the provided userId
      orders = await OrderModel.find(query).lean();
      console.log(`Found ${orders.length} orders with direct userId match`);
      
      // If no orders found and userId is not a Clerk ID, check if it's a MongoDB ObjectId
      // and try to find the user to get their Clerk ID
      if (orders.length === 0 && !userId.startsWith('user_') && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          // Try to find the user by MongoDB ID
          const user = await UserModel.findById(userId).lean();
          
          if (user && user.clerkId) {
            // If user has a Clerk ID, try to find orders with that ID
            console.log(`No orders found with MongoDB ID, trying with Clerk ID: ${user.clerkId}`);
            orders = await OrderModel.find({ userId: user.clerkId }).lean();
            console.log(`Found ${orders.length} orders with user's Clerk ID`);
          }
        } catch (userError) {
          console.error("Error finding user for order lookup:", userError);
          // Continue with empty orders array
        }
      }
      
      // If no orders found and userId looks like a Clerk ID, try to find the user's MongoDB ID
      if (orders.length === 0 && userId.startsWith('user_')) {
        try {
          // Try to find the user by Clerk ID
          const user = await UserModel.findOne({ clerkId: userId }).lean();
          
          if (user && user._id) {
            // If user found, try to find orders with their MongoDB ID
            const mongoId = user._id.toString();
            console.log(`No orders found with Clerk ID, trying with MongoDB ID: ${mongoId}`);
            orders = await OrderModel.find({ userId: mongoId }).lean();
            console.log(`Found ${orders.length} orders with user's MongoDB ID`);
          }
        } catch (userError) {
          console.error("Error finding user for order lookup:", userError);
          // Continue with empty orders array
        }
      }
      
      console.log(`Total found ${orders.length} orders for user ${userId}`);
      
      const convertedOrders = orders.map((o: any) => {
        const converted = convertOrder(o);
        return converted ? converted : null;
      }).filter((o: any) => o !== null) as Order[];
      
      return convertedOrders;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  },
  
  getOrder: async (id: string): Promise<Order | null> => {
    try {
      await connectDB();
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      
      // Get the order
      const order = await OrderModel.findById(id).lean();
      if (!order) return null;
      
      // Convert the order
      const convertedOrder = convertOrder(order);
      if (!convertedOrder) return null;
      
      // Get the user information if userId exists
      if (convertedOrder.userId) {
        try {
          let user;
          
          // Check if userId is a Clerk ID (starts with 'user_')
          if (convertedOrder.userId.startsWith('user_')) {
            // If it's a Clerk ID, search by clerkId field instead
            user = await UserModel.findOne({ clerkId: convertedOrder.userId }).lean();
          } else {
            // Otherwise, try to find by MongoDB ObjectId
            user = await UserModel.findById(convertedOrder.userId).lean();
          }
          
          if (user) {
            // Add user information to the order
            const convertedUser = convertUser(user);
            if (convertedUser) {
              // @ts-ignore - Adding user field to order
              convertedOrder.user = convertedUser;
            }
          }
        } catch (userError) {
          console.error("Error fetching user for order:", userError);
          // Continue even if user fetch fails
        }
      }
      
      return convertedOrder;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  },
  
  createOrder: async (order: Omit<Order, "id" | "createdAt">): Promise<Order> => {
    try {
      await connectDB();
      console.log('Creating order in MongoDB:', JSON.stringify(order));
      
      // Validate order data
      if (!order.userId) {
        throw new Error("Order must have a userId");
      }
      
      if (!Array.isArray(order.products) || order.products.length === 0) {
        throw new Error("Order must have at least one product");
      }
      
      // Create a clean order document to insert
      const orderDoc = {
        userId: String(order.userId),
        products: order.products.map(product => ({
          productId: String(product.productId),
          quantity: Number(product.quantity) || 1
        })),
        status: order.status || "pending",
        total: Number(order.total) || 0,
        createdAt: new Date(),
        // Add shipping address if provided
        shippingAddress: order.shippingAddress || undefined,
        // Add payment method if provided
        paymentMethod: order.paymentMethod || "cash_on_delivery",
        paymentStatus: order.paymentStatus || "pending",
        paymentDetails: order.paymentDetails || undefined
      };
      
      // Import the model
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      
      let newOrder;
      
      // Check if direct MongoDB access is available
      if (mongoose.connection && mongoose.connection.db) {
        try {
          // Use the direct MongoDB API to insert the document, bypassing Mongoose validation
          const result = await mongoose.connection.db.collection('orders').insertOne(orderDoc);
          
          if (!result.acknowledged || !result.insertedId) {
            throw new Error("Failed to insert order into MongoDB");
          }
          
          // Create a properly formatted order response
          newOrder = {
            id: result.insertedId.toString(),
            userId: orderDoc.userId,
            products: orderDoc.products,
            status: orderDoc.status,
            total: orderDoc.total,
            createdAt: orderDoc.createdAt.toISOString()
          };
          
          console.log('Order created successfully with direct MongoDB API, ID:', newOrder.id);
        } catch (directDbError) {
          console.error("Error using direct MongoDB API, falling back to Mongoose:", directDbError);
          // Will fall back to Mongoose approach below
        }
      } 
      
      // If direct MongoDB access failed or wasn't available, use Mongoose
      if (!newOrder) {
        try {
          // Use Mongoose to create the order (fallback)
          const orderModel = new OrderModel(orderDoc);
          // Type the saved order as a Document with appropriate properties
          const savedOrder = await orderModel.save() as unknown as { 
            _id: mongoose.Types.ObjectId | string;
            toObject: () => any;
          };
          
          // Get the ID safely with fallback
          const orderId = savedOrder._id 
            ? (typeof savedOrder._id === 'object' 
                ? savedOrder._id.toString() 
                : String(savedOrder._id))
            : `mongoose-${new Date().getTime()}`;
          
          newOrder = {
            id: orderId,
            userId: orderDoc.userId,
            products: orderDoc.products,
            status: orderDoc.status,
            total: orderDoc.total,
            createdAt: orderDoc.createdAt.toISOString()
          };
          
          console.log('Order created successfully with Mongoose, ID:', newOrder.id);
        } catch (mongooseError) {
          console.error("Error creating order with Mongoose:", mongooseError);
          
          // Last resort fallback - create a mock order with a random ID
          // This is better than completely failing the checkout
          newOrder = {
            id: `fallback-${new Date().getTime()}-${Math.random().toString(36).substring(2, 7)}`,
            userId: orderDoc.userId,
            products: orderDoc.products,
            status: orderDoc.status,
            total: orderDoc.total,
            createdAt: orderDoc.createdAt.toISOString()
          };
          
          console.log('Created fallback order with ID:', newOrder.id);
        }
      }
      
      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },
  
  updateOrderStatus: async (id: string, status: Order["status"]): Promise<Order | null> => {
    try {
      await connectDB();
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      ).lean();
      
      return updatedOrder ? convertOrder(updatedOrder) : null;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  deleteOrder: async (id: string): Promise<boolean> => {
    try {
      await connectDB();
      const { default: OrderModel } = await import('./models/Order') as { default: OrderModelType };
      const result = await OrderModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      await connectDB();
      console.log('Fetching users from MongoDB...');
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      const users = await UserModel.find().lean();
      console.log(`Found ${users.length} users in MongoDB`);
      
      const convertedUsers = users.map((u: any) => {
        const converted = convertUser(u);
        return converted ? converted : null;
      }).filter((u: any) => u !== null) as User[];
      
      console.log(`Converted ${convertedUsers.length} users`);
      return convertedUsers;
    } catch (error) {
      console.error("Error fetching users:", error);
      return fallbackUsers;
    }
  },
  
  getUser: async (id: string): Promise<User | null> => {
    try {
      await connectDB();
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      
      let user;
      
      // Check if id is a Clerk ID (starts with 'user_')
      if (id.startsWith('user_')) {
        // If it's a Clerk ID, search by clerkId field
        user = await UserModel.findOne({ clerkId: id }).lean();
      } else {
        // Check if id is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (isValidObjectId) {
          // If it's a valid ObjectId, use findById
          user = await UserModel.findById(id).lean();
        } else {
          // If it's not a valid ObjectId (like a numeric ID), try to find by other means
          // First, check if we have a custom field to use as an ID
          user = await UserModel.findOne({ customId: id }).lean();
          
          // If no user found and id is numeric, try to find by index position
          if (!user && /^\d+$/.test(id)) {
            // Convert string to number and subtract 1 to get zero-based index
            const numericId = parseInt(id, 10);
            const users = await UserModel.find().sort({ createdAt: 1 }).lean();
            user = users[numericId - 1] || null; // -1 because user IDs typically start at 1
          }
        }
      }
      
      return user ? convertUser(user) : null;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },
  
  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      await connectDB();
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      const user = await UserModel.findOne({ email }).lean();
      return user ? convertUser(user) : null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  },
  
  createUser: async (user: Omit<User, "id"> & { password: string }): Promise<User> => {
    try {
      await connectDB();
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      const newUser = await UserModel.create(user);
      const converted = convertUser(newUser);
      if (!converted) throw new Error("Failed to convert user");
      return converted;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
  updateUser: async (id: string, data: Partial<Omit<User, "id">>): Promise<User | null> => {
    try {
      await connectDB();
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      
      let userToUpdate;
      
      // Check if id is a Clerk ID (starts with 'user_')
      if (id.startsWith('user_')) {
        // If it's a Clerk ID, search by clerkId field
        userToUpdate = await UserModel.findOne({ clerkId: id }).lean();
      } else {
        // Check if id is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (isValidObjectId) {
          // If it's a valid ObjectId, use findById
          userToUpdate = await UserModel.findById(id).lean();
        } else {
          // If it's not a valid ObjectId (like a numeric ID), try to find by other means
          // First, check if we have a custom field to use as an ID
          userToUpdate = await UserModel.findOne({ customId: id }).lean();
          
          // If no user found and id is numeric, try to find by index position
          if (!userToUpdate && /^\d+$/.test(id)) {
            // Convert string to number and subtract 1 to get zero-based index
            const numericId = parseInt(id, 10);
            const users = await UserModel.find().sort({ createdAt: 1 }).lean();
            userToUpdate = users[numericId - 1] || null; // -1 because user IDs typically start at 1
          }
        }
      }
      
      if (!userToUpdate) return null;
      
      // Now we can update using the MongoDB ObjectId
      const updatedUser = await UserModel.findByIdAndUpdate(userToUpdate._id, { $set: data }, { new: true }).lean();
      return updatedUser ? convertUser(updatedUser) : null;
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  },
  
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await connectDB();
      const { default: UserModel } = await import('./models/User') as { default: UserModelType };
      
      // Check if id is a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
      
      let userToDelete;
      if (isValidObjectId) {
        // If it's a valid ObjectId, use findById
        userToDelete = await UserModel.findById(id).lean();
      } else {
        // If it's not a valid ObjectId (like a numeric ID), try to find by other means
        // First, check if we have a custom field to use as an ID
        userToDelete = await UserModel.findOne({ customId: id }).lean();
        
        // If no user found and id is numeric, try to find by index position
        if (!userToDelete && /^\d+$/.test(id)) {
          // Convert string to number and subtract 1 to get zero-based index
          const numericId = parseInt(id, 10);
          const users = await UserModel.find().sort({ createdAt: 1 }).lean();
          userToDelete = users[numericId - 1] || null; // -1 because user IDs typically start at 1
        }
      }
      
      if (!userToDelete) return false;
      
      // Now we can delete using the MongoDB ObjectId
      const result = await UserModel.findByIdAndDelete(userToDelete._id);
      return !!result;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    try {
      await connectDB();
      console.log('Fetching categories from MongoDB...');
      // Use dynamic import to avoid issues with SSR
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const categories = await CategoryModel.find().lean();
      console.log(`Found ${categories.length} categories in MongoDB`);
      
      const convertedCategories = categories.map((c: any) => {
        const converted = convertCategory(c);
        return converted ? converted : null;
      }).filter((c: any) => c !== null) as Category[];
      
      return convertedCategories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
  
  getCategory: async (id: string): Promise<Category | null> => {
    try {
      await connectDB();
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const category = await CategoryModel.findById(id).lean();
      return category ? convertCategory(category) : null;
    } catch (error) {
      console.error("Error fetching category:", error);
      return null;
    }
  },
  
  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      await connectDB();
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const category = await CategoryModel.findOne({ slug }).lean();
      return category ? convertCategory(category) : null;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      return null;
    }
  },
  
  createCategory: async (category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> => {
    try {
      await connectDB();
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const newCategory = await CategoryModel.create(category);
      const converted = convertCategory(newCategory);
      if (!converted) throw new Error("Failed to convert category after creation");
      return converted;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },
  
  updateCategory: async (id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category | null> => {
    try {
      await connectDB();
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const updatedCategory = await CategoryModel.findByIdAndUpdate(
        id, 
        { $set: data }, 
        { new: true }
      ).lean();
      
      return updatedCategory ? convertCategory(updatedCategory) : null;
    } catch (error) {
      console.error("Error updating category:", error);
      return null;
    }
  },
  
  deleteCategory: async (id: string): Promise<boolean> => {
    try {
      await connectDB();
      const { default: CategoryModel } = await import('./models/Category') as { default: CategoryModelType };
      const result = await CategoryModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },

  // Reviews
  getProductReviews: async (productId: string): Promise<Review[]> => {
    try {
      await connectDB();
      console.log(`Fetching reviews for product ${productId} from MongoDB...`);
      // Import the models dynamically only on the server
      const { default: ReviewModel } = await import('./models/Review') as { default: ReviewModelType };
      
      // Make sure productId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error(`Invalid productId: ${productId}`);
        return [];
      }
      
      const reviews = await ReviewModel.find({ 
        productId: new mongoose.Types.ObjectId(productId) 
      }).sort({ createdAt: -1 }).lean();
      
      console.log(`Found ${reviews.length} reviews for product ${productId}`);
      
      return reviews.map(review => convertReview(review)).filter(Boolean) as Review[];
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      return [];
    }
  },
  
  createReview: async (
    productId: string, 
    userId: string, 
    userName: string, 
    rating: number, 
    comment: string, 
    verified: boolean = false
  ): Promise<Review | null> => {
    try {
      await connectDB();
      console.log(`Creating review for product ${productId}, userId: ${userId}`);
      
      // Import the models dynamically only on the server
      const { default: ReviewModel } = await import('./models/Review') as { default: ReviewModelType };
      const { default: ProductModel } = await import('./models/Product') as { default: ProductModelType };
      
      // Make sure productId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error(`Invalid productId: ${productId}`);
        return null;
      }
      
      // Check if product exists
      const productObjectId = new mongoose.Types.ObjectId(productId);
      const product = await ProductModel.findById(productObjectId);
      if (!product) {
        console.error(`Product ${productId} not found`);
        return null;
      }
      
      // Check if user already has a review for this product
      let existingReview = null;
      try {
        existingReview = await ReviewModel.findOne({ 
          productId: productObjectId,
          userId
        });
        console.log("Existing review check result:", existingReview ? "Found" : "Not found");
      } catch (findError) {
        console.error("Error finding existing review:", findError);
      }
      
      let result = null;
      if (existingReview) {
        try {
          // Update existing review
          existingReview.rating = rating;
          existingReview.comment = comment;
          existingReview.userName = userName;
          existingReview.verified = verified;
          
          const updatedReview = await existingReview.save();
          console.log(`Updated existing review for product ${productId}`);
          
          result = convertReview(updatedReview.toObject());
        } catch (updateError) {
          console.error("Error updating review:", updateError);
          throw updateError;
        }
      } else {
        try {
          // Create new review
          const newReview = new ReviewModel({
            productId: productObjectId,
            userId,
            userName,
            rating,
            comment,
            verified
          });
          
          const savedReview = await newReview.save();
          console.log(`Created new review for product ${productId}`);
          
          result = convertReview(savedReview.toObject());
        } catch (createError) {
          console.error("Error creating new review:", createError);
          throw createError;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error creating/updating review for product ${productId}:`, error);
      throw error; // Re-throw the error instead of returning null
    }
  },
}

// Create a client-side database interface with mock data
const clientDb = {
  getProducts: async (): Promise<Product[]> => {
    console.log('Using client-side fallback for products');
    return fallbackProducts;
  },
  
  getProduct: async (id: string): Promise<Product | null> => {
    return fallbackProducts.find(p => p.id === id) || null;
  },
  
  addProduct: async (product: Omit<Product, "id">): Promise<Product> => {
    console.log('Client-side mock for addProduct - not actually creating product');
    return {
      id: `mock-${Math.random().toString(36).substring(2, 9)}`,
      ...product
    };
  },
  
  updateProduct: async (id: string, data: Partial<Product>): Promise<Product | null> => {
    console.log('Client-side mock for updateProduct - not actually updating product');
    const product = fallbackProducts.find(p => p.id === id);
    if (!product) return null;
    
    return { ...product, ...data };
  },
  
  deleteProduct: async (id: string): Promise<boolean> => {
    console.log('Client-side mock for deleteProduct - not actually deleting product');
    return true;
  },
  
  getOrders: async (): Promise<Order[]> => {
    console.log('Using client-side fallback for orders');
    return fallbackOrders;
  },
  
  getUserOrders: async (userId: string): Promise<Order[]> => {
    console.log(`Client-side: Fetching orders for user ${userId}`);
    // In client-side mode, we need to filter the fallback orders
    // Try to match by exact userId first
    let filteredOrders = fallbackOrders.filter(o => o.userId === userId);
    
    // If no orders found, return empty array (client-side can't do the complex matching the server does)
    console.log(`Client-side: Found ${filteredOrders.length} orders for user ${userId}`);
    return filteredOrders;
  },
  
  getOrder: async (id: string): Promise<Order | null> => {
    return fallbackOrders.find(o => o.id === id) || null;
  },
  
  createOrder: async (order: Omit<Order, "id" | "createdAt">): Promise<Order> => {
    console.log('Client-side mock for createOrder - not actually creating order');
    
    // Create a consistent mock order response that matches our new server implementation
    return {
      id: `mock-${Math.random().toString(36).substring(2, 9)}`,
      userId: String(order.userId),
      products: order.products.map(product => ({
        productId: String(product.productId),
        quantity: Number(product.quantity) || 1
      })),
      status: order.status || "pending",
      total: Number(order.total) || 0,
      createdAt: new Date().toISOString()
    };
  },
  
  updateOrderStatus: async (id: string, status: Order["status"]): Promise<Order | null> => {
    console.log('Client-side mock for updateOrderStatus - not actually updating order');
    const order = fallbackOrders.find(o => o.id === id);
    if (!order) return null;
    
    return { ...order, status };
  },
  
  deleteOrder: async (id: string): Promise<boolean> => {
    console.log('Client-side mock for deleteOrder - not actually deleting order');
    return true;
  },
  
  getUsers: async (): Promise<User[]> => {
    console.log('Using client-side fallback for users');
    return fallbackUsers;
  },
  
  getUser: async (id: string): Promise<User | null> => {
    return fallbackUsers.find(u => u.id === id) || null;
  },
  
  getUserByEmail: async (email: string): Promise<User | null> => {
    return fallbackUsers.find(u => u.email === email) || null;
  },
  
  createUser: async (user: Omit<User, "id"> & { password: string }): Promise<User> => {
    console.log('Client-side mock for createUser - not actually creating user');
    const { password, ...userWithoutPassword } = user;
    return {
      id: `mock-${Math.random().toString(36).substring(2, 9)}`,
      ...userWithoutPassword
    };
  },
  
  updateUser: async (id: string, data: Partial<Omit<User, "id">>): Promise<User | null> => {
    console.log('Client-side mock for updateUser - not actually updating user');
    const user = fallbackUsers.find(u => u.id === id);
    if (!user) return null;
    
    return { ...user, ...data };
  },
  
  deleteUser: async (id: string): Promise<boolean> => {
    console.log('Client-side mock for deleteUser - not actually deleting user');
    return true;
  },

  // Client-side category methods
  getCategories: async (): Promise<Category[]> => {
    console.log('Using client-side fallback for categories');
    return [];
  },
  
  getCategory: async (id: string): Promise<Category | null> => {
    return null;
  },
  
  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    return null;
  },
  
  createCategory: async (category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> => {
    console.log('Client-side mock for createCategory - not actually creating category');
    return {
      id: `mock-${Math.random().toString(36).substring(2, 9)}`,
      ...category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },
  
  updateCategory: async (id: string, data: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category | null> => {
    console.log('Client-side mock for updateCategory - not actually updating category');
    return null;
  },
  
  deleteCategory: async (id: string): Promise<boolean> => {
    console.log('Client-side mock for deleteCategory - not actually deleting category');
    return true;
  },
}

// Export the DB interface based on the environment
export const db = isServer ? serverDb : {
  // Client-side implementations
  getProducts: async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return fallbackProducts;
    }
  },
  
  getProduct: async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },
  
  // Reviews - Client-side implementations
  getProductReviews: async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },
  
  createReview: async (
    productId: string, 
    userId: string, 
    userName: string, 
    rating: number, 
    comment: string, 
    verified: boolean = false
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          userName,
          rating,
          comment,
          verified
        })
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.review;
    } catch (error) {
      console.error('Error creating review:', error);
      return null;
    }
  },
  
  // Other client-side functions would be implemented similarly
  updateProduct: async () => { throw new Error('Not implemented on client side'); },
  deleteProduct: async () => { throw new Error('Not implemented on client side'); },
  // ... other stubs for admin operations
  getUsers: async () => [],
  getUser: async () => null,
  addUser: async () => null,
  updateUser: async () => null,
  deleteUser: async () => null,
  getOrders: async () => [],
  getOrder: async () => null,
  addOrder: async () => null,
  updateOrder: async () => null,
  deleteOrder: async () => null,
  updateProductStock: async () => null,
  getCategories: async () => [],
  getCategory: async () => null,
  createCategory: async () => null,
  updateCategory: async () => null,
  deleteCategory: async () => null,
};
