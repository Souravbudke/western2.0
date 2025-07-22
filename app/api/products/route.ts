import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.description || body.price === undefined || !body.category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    // Create the product
    const product = await db.addProduct({
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      category: body.category,
      image: body.image || "/placeholder.svg?height=300&width=300",
      imageCid: body.imageCid || undefined,
      stock: parseInt(body.stock) || 0,
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const products = await db.getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 