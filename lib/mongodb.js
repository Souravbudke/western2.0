import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahimarhovale:mahimarhovale@glam.8wmwe8m.mongodb.net/BeautyStore';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

// Add to global mongoose so we can reuse connections
const globalMongo = global.mongoose || {};
global.mongoose = globalMongo;

let cached = globalMongo;

if (!cached) {
  cached = globalMongo;
  cached.conn = null;
  cached.promise = null;
}

async function connectDB() {
  // If we already have a connection, check its state
  if (cached.conn) {
    // Make sure the connection is ready or establish a new one
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB connection not in ready state, reconnecting...');
      cached.conn = null;
      cached.promise = null;
    } else {
      return cached.conn;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Increase max connections
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Use IPv4, bypass IPv6 issues
    };

    console.log('Establishing new MongoDB connection...');
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        
        // Add connection event listeners
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
          cached.conn = null;
          cached.promise = null;
        });
        
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
          cached.conn = null;
          cached.promise = null;
        });
        
        return mongoose;
      })
      .catch(err => {
        console.error('MongoDB connection failed:', err);
        cached.promise = null;
        throw err;
      });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', error);
    throw error;
  }
}

export default connectDB; 