const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://mahimarhovale:mahimarhovale@glam.8wmwe8m.mongodb.net/BeautyStore';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  bufferCommands: false,
}).then(() => {
  console.log('Connected to MongoDB');
  seedDatabase();
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Define schemas
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  password: { type: String, required: true },
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, default: 1 }
    }
  ],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered'],
    default: 'pending'
  },
  total: { type: Number, required: true },
}, { timestamps: true });

// Create models
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

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
    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({})
    ]);
    
    console.log('Cleared existing data');
    
    // Insert products
    const createdProducts = await Product.insertMany(products);
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
    
    const createdUsers = await User.insertMany(hashedUsers);
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
      
      const createdOrders = await Order.insertMany(orders);
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
    
    process.exit(1);
  }
} 