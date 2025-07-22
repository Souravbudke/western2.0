import mongoose from 'mongoose';

// Define the schema for Reviews
const ReviewSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  comment: { 
    type: String, 
    required: true 
  },
  verified: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add an index to make querying by productId faster
ReviewSchema.index({ productId: 1 });

// Create or get the model
let ReviewModel;
if (mongoose.models && typeof mongoose.models.Review !== 'undefined') {
  ReviewModel = mongoose.models.Review;
} else if (mongoose.model) {
  try {
    ReviewModel = mongoose.model('Review', ReviewSchema);
  } catch (error) {
    // If error because model already exists, use the existing model
    ReviewModel = mongoose.models.Review;
  }
}

export default ReviewModel; 