import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = 'https://api.clerk.com/v1';

// This is a special endpoint that deletes a user from both Clerk and MongoDB
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get user ID from params
    const userId = params.id;
    console.log(`DELETE /api/users/${userId}/delete-with-clerk: Beginning deletion process`);

    // 1. Find the user in MongoDB first to get their email
    const user = await db.getUser(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found in MongoDB`);
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log(`Found user in MongoDB: ${user.email}`);
    
    let clerkUserDeleted = false;
    
    // 2. Try to find the corresponding user in Clerk by email
    if (user.email && CLERK_SECRET_KEY) {
      console.log(`Looking for user in Clerk by email: ${user.email}`);
      
      try {
        // First try to find by email (newer API format)
        let searchResponse = await fetch(`${CLERK_API_URL}/users?email_address=${encodeURIComponent(user.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If that fails, try older API format
        if (!searchResponse.ok) {
          searchResponse = await fetch(`${CLERK_API_URL}/users?emailAddress=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!searchResponse.ok) {
          throw new Error(`Clerk API error: ${searchResponse.status} ${searchResponse.statusText}`);
        }
        
        const data = await searchResponse.json();
        const clerkUsers = data.data || [];
        
        console.log(`Found ${clerkUsers.length} matching users in Clerk`);
        
        // If user found in Clerk, delete them
        if (clerkUsers.length > 0) {
          const clerkUser = clerkUsers[0];
          console.log(`Found matching Clerk user with ID: ${clerkUser.id}`);
          
          // Delete from Clerk
          console.log(`Deleting user from Clerk: ${clerkUser.id}`);
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
          
          console.log(`Successfully deleted user from Clerk: ${clerkUser.id}`);
          clerkUserDeleted = true;
        } else {
          console.log(`No matching user found in Clerk for email: ${user.email}`);
        }
      } catch (clerkError) {
        // Log but continue - we still want to delete from MongoDB even if Clerk fails
        console.error(`Error interacting with Clerk API:`, clerkError);
      }
    }
    
    // 3. Finally, delete from MongoDB
    console.log(`Deleting user from MongoDB: ${userId}`);
    const deleted = await db.deleteUser(userId);
    
    if (deleted) {
      console.log(`Successfully deleted user from MongoDB: ${userId}`);
      return NextResponse.json({ 
        success: true,
        message: clerkUserDeleted 
          ? 'User successfully deleted from both Clerk and MongoDB'
          : 'User deleted from MongoDB only. No matching Clerk user found.'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete user from MongoDB' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in delete-with-clerk:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', message: (error as Error).message },
      { status: 500 }
    );
  }
} 