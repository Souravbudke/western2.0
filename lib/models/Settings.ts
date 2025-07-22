import mongoose, { Document, Model, Schema } from 'mongoose';

export interface SettingsDocument extends Document {
  key: string;
  value: any;
  updatedAt: Date;
  updatedBy?: string;
}

const SettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: String, required: false },
}, { timestamps: true });

// Use a function to create/get the model to avoid issues with Next.js hot reloading
const getSettingsModel = (): Model<SettingsDocument> => {
  try {
    // Try to get the existing model first
    return mongoose.models.Settings as Model<SettingsDocument> || 
           mongoose.model<SettingsDocument>('Settings', SettingsSchema);
  } catch (error) {
    // If error because model already exists with different schema, delete it and recreate
    console.log('Error getting Settings model, creating new one', error);
    
    // If the model exists but with a different schema, delete it and recreate
    if (mongoose.models.Settings) {
      delete mongoose.models.Settings;
    }
    
    // Create a new model with our schema
    return mongoose.model<SettingsDocument>('Settings', SettingsSchema);
  }
};

export default getSettingsModel; 