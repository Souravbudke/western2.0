import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import CarouselModel, { ICarousel } from "@/lib/models/Carousel";

export async function GET() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Use the Carousel model to find the first carousel document
    const carousel = await CarouselModel.findOne({});
    
    // Return the images array or an empty array if no document exists
    return NextResponse.json(carousel?.images || []);
  } catch (error) {
    console.error("Error fetching carousel:", error);
    return NextResponse.json(
      { error: "Failed to fetch carousel images" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { images } = await request.json();
    
    // Connect to database first
    await connectToDatabase();
    
    // Update or create the carousel document using findOneAndUpdate with upsert
    await CarouselModel.findOneAndUpdate(
      {}, // empty filter to match any document
      { images }, // data to update
      { upsert: true, new: true } // create if not exists, return updated doc
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving carousel:", error);
    return NextResponse.json(
      { error: "Failed to save carousel images" },
      { status: 500 }
    );
  }
} 