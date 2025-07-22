import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';

// GET /api/users - Get all users
export async function GET() {
  try {
    await connectDB(); // Ensure connection is established
    console.log('GET /api/users: Fetching all users');
    const users = await db.getUsers();
    console.log(`GET /api/users: Found ${users.length} users`);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    console.log('POST /api/users: Creating new user');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user with email already exists
    const existingUser = await db.getUserByEmail(body.email);
    if (existingUser) {
      console.log('User with email already exists:', body.email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Create the user
    await connectDB(); // Make sure we have a connection to MongoDB
    const newUser = await db.createUser({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role || 'customer',
    });
    
    console.log('New user created:', newUser.id);
    
    // Don't return the password
    const { password, ...userWithoutPassword } = newUser as any;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 