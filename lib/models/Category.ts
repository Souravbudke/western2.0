import mongoose, { Document, Model, Schema } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Check if we're on the server (mongoose is properly defined) and the model doesn't already exist
let CategoryModel: Model<CategoryDocument>;

// Use a function to create/get the model to avoid issues with Next.js hot reloading
const getCategoryModel = (): Model<CategoryDocument> => {
  try {
    // Try to get the existing model first
    return mongoose.models.Category as Model<CategoryDocument> || 
           mongoose.model<CategoryDocument>('Category', CategorySchema);
  } catch (error) {
    // If error because model already exists with different schema, overwrite it
    console.log('Error getting Category model, creating new one', error);
    
    // If the model exists but with a different schema, delete it and recreate
    if (mongoose.models.Category) {
      delete mongoose.models.Category;
    }
    
    // Create a new model with our schema
    return mongoose.model<CategoryDocument>('Category', CategorySchema);
  }
};

// Only initialize the model on the server side
if (typeof window === 'undefined') {
  CategoryModel = getCategoryModel();
} else {
  // On client side, just create a type placeholder that won't be used
  CategoryModel = {} as Model<CategoryDocument>;
}

export default CategoryModel; 