import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';

// Use direct fetch approach with Clerk API
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1';

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to safely get ID from params
const getParamId = async (params: RouteParams['params']) => {
  // This ensures params is properly awaited in Next.js 15
  const resolvedParams = await Promise.resolve(params);
  return resolvedParams?.id || '';
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const userId = await getParamId(params);
    
    await connectDB(); // Ensure connection is established
    
    // Get user by ID
    console.log(`GET /api/users/${userId}: Fetching user`);
    const user = await db.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`GET /api/users/${userId}: User found`);
    return NextResponse.json(user);
  } catch (error) {
    // Safely get the ID for error logging
    const safeId = await getParamId(params).catch(() => 'unknown');
    console.error(`Error fetching user ${safeId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const userId = await getParamId(params);
    console.log(`PATCH /api/users/${userId}: Beginning update`);
    
    const body = await request.json();
    console.log(`Update data received:`, JSON.stringify(body));
    
    // Find the user first
    const user = await db.getUser(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found for update`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    
    // If password is provided, hash it
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }
    
    console.log(`Updating user in MongoDB: ${userId}`);
    
    // Update the user in MongoDB
    const updatedUser = await db.updateUser(userId, updateData);
    if (!updatedUser) {
      console.error(`Failed to update user ${userId} in database`);
      return NextResponse.json(
        { error: 'Failed to update user in database' },
        { status: 500 }
      );
    }
    
    console.log(`User ${userId} updated in our database`);
    
    // Attempt to update in Clerk if needed
    try {
      // Try to find a matching Clerk user by email
      if (user.email && CLERK_SECRET_KEY) {
        // Use direct Clerk API call with fetch
        const response = await fetch(`${CLERK_API_URL}/users?email_address=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const clerkUsers = data.data || [];
        
        if (clerkUsers.length > 0) {
          const clerkUser = clerkUsers[0];
          console.log(`Found matching Clerk user for ${user.email}`);
          
          // Prepare Clerk update data
          const clerkUpdateData: any = {};
          
          // Only update fields that changed
          if (body.name && user.name !== body.name) {
            // Split name into first and last
            const nameParts = body.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            clerkUpdateData.first_name = firstName;
            clerkUpdateData.last_name = lastName;
          }
          
          if (body.role && user.role !== body.role) {
            clerkUpdateData.public_metadata = {
              ...(clerkUser.public_metadata || {}),
              role: body.role
            };
          }
          
          // Only call Clerk API if we have changes
          if (Object.keys(clerkUpdateData).length > 0) {
            console.log(`Updating user in Clerk: ${clerkUser.id}`);
            
            const updateResponse = await fetch(`${CLERK_API_URL}/users/${clerkUser.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(clerkUpdateData)
            });
            
            if (!updateResponse.ok) {
              throw new Error(`Clerk API update error: ${updateResponse.status} ${updateResponse.statusText}`);
            }
            
            console.log(`Clerk user updated: ${clerkUser.id}`);
          }
        } else {
          console.log(`No matching Clerk user found for ${user.email}`);
        }
      }
    } catch (clerkError) {
      // Log but don't fail if Clerk update fails
      console.error(`Error updating Clerk user: ${clerkError}`);
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Get ID safely using our helper function
    const userId = await getParamId(params);
    console.log(`DELETE /api/users/${userId}: Beginning deletion`);
    
    // Find the user first
    const user = await db.getUser(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found for deletion`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`Deleting user from MongoDB: ${userId}`);
    
    // Delete the user from our database
    await db.deleteUser(userId);
    
    // Attempt to delete or deactivate in Clerk if needed
    try {
      // Try to find a matching Clerk user by email
      if (user.email && CLERK_SECRET_KEY) {
        // Use direct Clerk API call with fetch
        const response = await fetch(`${CLERK_API_URL}/users?email_address=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const clerkUsers = data.data || [];
        
        if (clerkUsers.length > 0) {
          const clerkUser = clerkUsers[0];
          console.log(`Found matching Clerk user for ${user.email}`);
          
          // Delete the user from Clerk
          console.log(`Deleting user in Clerk: ${clerkUser.id}`);
          
          const deleteResponse = await fetch(`${CLERK_API_URL}/users/${clerkUser.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!deleteResponse.ok) {
            throw new Error(`Clerk API delete error: ${deleteResponse.status} ${deleteResponse.statusText}`);
          }
          
          console.log(`Clerk user deleted: ${clerkUser.id}`);
        } else {
          console.log(`No matching Clerk user found for ${user.email}`);
        }
      }
    } catch (clerkError) {
      // Log but don't fail if Clerk deletion fails
      console.error(`Error deleting Clerk user: ${clerkError}`);
    }
    
    console.log(`User deletion completed: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 