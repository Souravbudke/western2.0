import mongoose from 'mongoose';

// Only create the model on the server side
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  imageCid: { type: String, required: false }, // Optional field to store Pinata CID
  stock: { type: Number, required: true, default: 0 },
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  },
  // This is important to allow for population across schemas
  strictPopulate: false
});

// Virtual field for reviews - configure it to work with the Review model
ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
  justOne: false // Set to false since a product can have multiple reviews
});

// Check if we're on the server (mongoose is properly defined) and if the model already exists
let ProductModel;
if (mongoose.models && typeof mongoose.models.Product !== 'undefined') {
  ProductModel = mongoose.models.Product;
} else if (mongoose.model) {
  // Only create the model if we're on the server side
  try {
    ProductModel = mongoose.model('Product', ProductSchema);
  } catch (error) {
    // If error because model already exists, use the existing model
    ProductModel = mongoose.models.Product;
  }
}

export default ProductModel; 