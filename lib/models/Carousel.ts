import mongoose, { Document, Model } from 'mongoose';

// Define interface for a single carousel image
interface ICarouselImage {
  url: string;
  cid?: string;
}

// Define interface for Carousel document
export interface ICarousel extends Document {
  images: ICarouselImage[];
  createdAt: Date;
  updatedAt: Date;
}

const CarouselSchema = new mongoose.Schema({
  images: [
    {
      url: { type: String, required: true },
      cid: { type: String, required: false },
    },
  ],
}, { timestamps: true });

// Create a type-safe model
let CarouselModel: Model<ICarousel>;

// Check if we're in an environment where mongoose models are available
if (mongoose.models && mongoose.models.Carousel) {
  CarouselModel = mongoose.models.Carousel as Model<ICarousel>;
} else {
  try {
    CarouselModel = mongoose.model<ICarousel>('Carousel', CarouselSchema);
  } catch (error) {
    // If error because model already exists, use the existing model
    CarouselModel = mongoose.models.Carousel as Model<ICarousel>;
  }
}

export default CarouselModel; 