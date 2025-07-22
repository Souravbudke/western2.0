import mongoose from 'mongoose';

// Only create the model on the server side
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  password: { type: String, required: true },
  clerkId: { type: String, sparse: true }, // Add Clerk user ID reference
}, { timestamps: true });

// Check if we're on the server (mongoose is properly defined) and if the model already exists
let UserModel;
if (mongoose.models && typeof mongoose.models.User !== 'undefined') {
  UserModel = mongoose.models.User;
} else if (mongoose.model) {
  // Only create the model if we're on the server side
  try {
    UserModel = mongoose.model('User', UserSchema);
  } catch (error) {
    // If error because model already exists, use the existing model
    UserModel = mongoose.models.User;
  }
}

export default UserModel; 