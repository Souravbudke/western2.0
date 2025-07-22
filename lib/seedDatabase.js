import connectDB from './mongodb.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import models
let ProductModel, UserModel, OrderModel;

// Dynamically import the models
async function importModels() {
  const ProductModule = await import('./models/Product.js');
  const UserModule = await import('./models/User.js');
  const OrderModule = await import('./models/Order.js');
  
  ProductModel = ProductModule.default;
  UserModel = UserModule.default;
  OrderModel = OrderModule.default;
}

// Initial seed data
const products = [
  {
    name: "Radiance Serum",
    description: "A lightweight serum that brightens and evens skin tone.",
    price: 39.99,
    category: "Skincare",
    image: "/placeholder.svg?height=300&width=300",
    stock: 25,
  },
  {
    name: "Velvet Matte Lipstick",
    description: "Long-lasting matte lipstick with a smooth, velvet finish.",
    price: 24.99,
    category: "Makeup",
    image: "/placeholder.svg?height=300&width=300",
    stock: 40,
  },
  {
    name: "Hydrating Face Mask",
    description: "Intensive hydrating mask for dry and sensitive skin.",
    price: 19.99,
    category: "Skincare",
    image: "/placeholder.svg?height=300&width=300",
    stock: 30,
  },
  {
    name: "Volume Boost Mascara",
    description: "Adds dramatic volume and length to lashes without clumping.",
    price: 22.99,
    category: "Makeup",
    image: "/placeholder.svg?height=300&width=300",
    stock: 35,
  },
  {
    name: "Nourishing Hair Oil",
    description: "Lightweight oil that nourishes and adds shine to hair.",
    price: 29.99,
    category: "Haircare",
    image: "/placeholder.svg?height=300&width=300",
    stock: 20,
  },
  {
    name: "Exfoliating Body Scrub",
    description: "Gentle exfoliating scrub that leaves skin smooth and refreshed.",
    price: 34.99,
    category: "Bodycare",
    image: "/placeholder.svg?height=300&width=300",
    stock: 15,
  },
];

const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "adminpassword", // Will be hashed before saving
    role: "admin",
  },
  {
    name: "Customer User",
    email: "customer@example.com",
    password: "customerpassword", // Will be hashed before saving
    role: "customer",
  },
];

// Function to seed the database
async function seedDatabase() {
  try {
    // Import models first
    await importModels();
    
    // Connect to the database
    await connectDB();
    
    // Clear existing data
    await Promise.all([
      ProductModel.deleteMany({}),
      UserModel.deleteMany({}),
      OrderModel.deleteMany({})
    ]);
    
    console.log('Cleared existing data');
    
    // Insert products
    const createdProducts = await ProductModel.insertMany(products);
    console.log(`Inserted ${createdProducts.length} products`);
    
    // Hash passwords and insert users
    const hashedUsers = await Promise.all(users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return {
        ...user,
        password: hashedPassword
      };
    }));
    
    const createdUsers = await UserModel.insertMany(hashedUsers);
    console.log(`Inserted ${createdUsers.length} users`);
    
    // Create sample orders
    // Get the first customer user
    const customerUser = createdUsers.find(user => user.role === 'customer');
    
    if (customerUser) {
      const orders = [
        {
          userId: customerUser._id,
          products: [
            { productId: createdProducts[0]._id, quantity: 1 },
            { productId: createdProducts[2]._id, quantity: 2 },
          ],
          status: "delivered",
          total: 79.97,
        },
        {
          userId: customerUser._id,
          products: [
            { productId: createdProducts[1]._id, quantity: 1 },
            { productId: createdProducts[4]._id, quantity: 1 },
          ],
          status: "processing",
          total: 54.98,
        },
      ];
      
      const createdOrders = await OrderModel.insertMany(orders);
      console.log(`Inserted ${createdOrders.length} orders`);
    }
    
    console.log('Database seeded successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    return {
      success: true,
      message: 'Database seeded successfully'
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    
    // Disconnect from MongoDB even if there's an error
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB after error');
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
    
    return {
      success: false,
      message: `Error seeding database: ${error.message}`
    };
  }
}

// Export in a way that's compatible with both CommonJS and ES modules
export { seedDatabase }; 