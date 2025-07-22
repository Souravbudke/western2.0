import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import connectDB from "@/lib/mongodb"

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/categories/[id] - Get a specific category
export async function GET(request: Request, { params }: RouteParams) {
  try {
    await connectDB() // Ensure connection is established
    const category = await db.getCategory(params.id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PATCH /api/categories/[id] - Update a category
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate the request body
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      )
    }
    
    // Find the category first
    await connectDB() // Ensure connection is established
    const category = await db.getCategory(params.id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // If slug is provided, verify it's not a duplicate
    if (body.slug) {
      const slug = body.slug.toLowerCase().replace(/\s+/g, '-')
      const existingCategory = await db.getCategoryBySlug(slug)
      
      if (existingCategory && existingCategory.id !== params.id) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        )
      }
      
      // Update the slug in the body
      body.slug = slug
    }
    
    // Update the category
    const updatedCategory = await db.updateCategory(params.id, body)
    
    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Find the category first
    await connectDB() // Ensure connection is established
    const category = await db.getCategory(params.id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    
    // Delete the category
    await db.deleteCategory(params.id)
    
    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
} 