import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import connectDB from "@/lib/mongodb"

// GET /api/categories - Get all categories
export async function GET() {
  try {
    await connectDB() // Ensure connection is established
    const categories = await db.getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required fields' },
        { status: 400 }
      )
    }
    
    // Convert the slug to lowercase and replace spaces with hyphens
    const slug = body.slug.toLowerCase().replace(/\s+/g, '-')
    
    // Check if a category with the same slug already exists
    await connectDB()
    const existingCategory = await db.getCategoryBySlug(slug)
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }
    
    // Create the category
    const newCategory = await db.createCategory({
      name: body.name,
      description: body.description || '',
      slug: slug,
      isActive: body.isActive !== undefined ? body.isActive : true,
    })
    
    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
} 