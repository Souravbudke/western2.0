import mongoose from 'mongoose';

// Only create the model on the server side
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: false },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Check if we're on the server (mongoose is properly defined) and if the model already exists
let CategoryModel;
try {
  // Try to get the existing model first
  CategoryModel = mongoose.models.Category || mongoose.model('Category', CategorySchema);
} catch (error) {
  // If error because model already exists with different schema, overwrite it
  console.log('Error getting Category model, creating new one', error);
  
  // If the model exists but with a different schema, delete it and recreate
  if (mongoose.models.Category) {
    delete mongoose.models.Category;
  }
  
  // Create a new model with our schema
  CategoryModel = mongoose.model('Category', CategorySchema);
}

export default CategoryModel; 