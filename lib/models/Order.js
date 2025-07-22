import mongoose from 'mongoose';

// Only create the model on the server side
const OrderSchema = new mongoose.Schema({
  // Use types that allow for schema flexibility
  userId: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  products: [
    {
      productId: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
      },
      quantity: { type: Number, required: true, default: 1 }
    }
  ],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered'],
    default: 'pending'
  },
  total: { type: Number, required: true },
  // Adding shipping address fields
  shippingAddress: {
    fullName: { type: String },
    streetAddress: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    phone: { type: String }
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['paypal', 'cash_on_delivery'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    type: mongoose.Schema.Types.Mixed
  }
}, { 
  timestamps: true,
  // Disable strict mode to allow flexible document structure
  strict: false
});

// Check if we're on the server (mongoose is properly defined) and if the model already exists
let OrderModel;
try {
  // Try to get the existing model first
  OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
} catch (error) {
  // If error because model already exists with different schema, overwrite it
  console.log('Error getting Order model, creating new one', error);
  
  // If the model exists but with a different schema, delete it and recreate
  if (mongoose.models.Order) {
    delete mongoose.models.Order;
  }
  
  // Create a new model with our schema
  OrderModel = mongoose.model('Order', OrderSchema);
}

export default OrderModel; 