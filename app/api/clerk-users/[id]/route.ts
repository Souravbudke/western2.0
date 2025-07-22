import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET endpoint to fetch a specific Clerk user by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch the user from your database
    const user = await db.getUser(id);
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new NextResponse(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`Error fetching user:`, error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to fetch user',
      message: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE endpoint to delete a specific Clerk user by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Delete the user from your database
    const deleted = await db.deleteUser(id);
    
    if (!deleted) {
      return new NextResponse(JSON.stringify({ error: 'User not found or could not be deleted' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new NextResponse(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`Error deleting user:`, error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to delete user',
      message: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH endpoint to update a specific Clerk user by ID
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Parse the request body
    const body = await req.json();
    
    // Validate the request body
    if (!body || Object.keys(body).length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Request body is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Update the user in your database
    const updated = await db.updateUser(id, body);
    
    if (!updated) {
      return new NextResponse(JSON.stringify({ error: 'User not found or could not be updated' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch the updated user
    const user = await db.getUser(id);
    
    return new NextResponse(JSON.stringify({ 
      success: true, 
      message: 'User updated successfully',
      user
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`Error updating user:`, error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to update user',
      message: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
