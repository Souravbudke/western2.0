import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deleteFromPinata } from "@/utils/pinata"

interface RouteParams {
  params: {
    id: string
  }
}

// Helper function to safely get ID from params
const getParamId = async (params: RouteParams['params']) => {
  // This ensures params is properly awaited in Next.js 15
  const resolvedParams = await Promise.resolve(params);
  return resolvedParams?.id || '';
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const id = await getParamId(params);
    const product = await db.getProduct(id)
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const id = await getParamId(params);
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description || body.price === undefined || !body.category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Check if product exists
    const existingProduct = await db.getProduct(params.id)
    
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Update the product
    const updatedProduct = await db.updateProduct(id, {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      category: body.category,
      image: body.image,
      imageCid: body.imageCid || undefined,
      stock: parseInt(body.stock),
    })
    
    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const id = await getParamId(params);
    // Check if product exists
    const existingProduct = await db.getProduct(id)
    
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Track Pinata deletion results
    const pinataResults = [];
    
    // Delete the main product image from Pinata if there's a CID
    if (existingProduct.imageCid) {
      try {
        console.log(`Deleting main product image from Pinata with CID: ${existingProduct.imageCid}`);
        const deleteResult = await deleteFromPinata(existingProduct.imageCid);
        pinataResults.push({
          type: 'main-image',
          cid: existingProduct.imageCid,
          success: deleteResult.success,
          message: deleteResult.message || deleteResult.error
        });
      } catch (pinataError) {
        console.error("Error deleting main image from Pinata:", pinataError);
        pinataResults.push({
          type: 'main-image',
          cid: existingProduct.imageCid,
          success: false,
          message: pinataError instanceof Error ? pinataError.message : 'Unknown error'
        });
      }
    } else if (existingProduct.image) {
      // Try to extract CID from the image URL if imageCid is not directly available
      try {
        const imageUrl = existingProduct.image;
        if (imageUrl && imageUrl.includes('/ipfs/')) {
          const cid = imageUrl.split('/ipfs/')[1].split('?')[0]; // Extract CID from URL
          if (cid) {
            console.log(`Extracted CID from URL: ${cid}. Attempting to delete from Pinata.`);
            const deleteResult = await deleteFromPinata(cid);
            pinataResults.push({
              type: 'main-image-from-url',
              cid: cid,
              success: deleteResult.success,
              message: deleteResult.message || deleteResult.error
            });
          }
        }
      } catch (extractError) {
        console.error("Error extracting or deleting CID from image URL:", extractError);
        pinataResults.push({
          type: 'main-image-from-url',
          success: false,
          message: extractError instanceof Error ? extractError.message : 'CID extraction failed'
        });
      }
    }
    
    // Handle gallery images if the product has them
    // @ts-ignore - Handle gallery property even if not defined in the type
    if (existingProduct.gallery && Array.isArray(existingProduct.gallery)) {
      // @ts-ignore - Access gallery property even if not defined in the type
      for (const galleryItem of existingProduct.gallery) {
        if (galleryItem && galleryItem.cid) {
          try {
            console.log(`Deleting gallery image from Pinata with CID: ${galleryItem.cid}`);
            const deleteResult = await deleteFromPinata(galleryItem.cid);
            pinataResults.push({
              type: 'gallery-image',
              cid: galleryItem.cid,
              success: deleteResult.success,
              message: deleteResult.message || deleteResult.error
            });
          } catch (galleryError) {
            console.error(`Error deleting gallery image with CID ${galleryItem.cid}:`, galleryError);
            pinataResults.push({
              type: 'gallery-image',
              cid: galleryItem.cid,
              success: false,
              message: galleryError instanceof Error ? galleryError.message : 'Unknown error'
            });
          }
        } else if (galleryItem && galleryItem.url) {
          // Try to extract CID from URL
          try {
            const imageUrl = galleryItem.url;
            if (imageUrl && imageUrl.includes('/ipfs/')) {
              const cid = imageUrl.split('/ipfs/')[1].split('?')[0]; // Extract CID from URL
              if (cid) {
                console.log(`Extracted CID from gallery URL: ${cid}. Attempting to delete from Pinata.`);
                const deleteResult = await deleteFromPinata(cid);
                pinataResults.push({
                  type: 'gallery-image-from-url',
                  cid: cid,
                  success: deleteResult.success,
                  message: deleteResult.message || deleteResult.error
                });
              }
            }
          } catch (extractError) {
            console.error("Error extracting or deleting CID from gallery URL:", extractError);
          }
        }
      }
    }
    
    // Delete the product from database
    const success = await db.deleteProduct(id)
    
    if (!success) {
      return NextResponse.json({ 
        error: "Failed to delete product",
        pinataResults // Include Pinata results even if product deletion failed
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Product and associated images have been deleted successfully",
      pinataResults // Include detailed results of Pinata deletions
    })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 