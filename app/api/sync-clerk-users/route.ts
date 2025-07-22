import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to convert Clerk user to database user format
function clerkUserToDbUser(clerkUser: any) {
  // Ensure role is either 'admin' or 'customer' to match the User type
  const userRole: 'admin' | 'customer' = clerkUser.publicMetadata?.role === 'admin' ? 'admin' : 'customer';
  
  return {
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unnamed User',
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    role: userRole,
    // We don't store passwords for Clerk users
    password: 'clerk-auth-user',
    // Add Clerk user ID for future reference
    clerkId: clerkUser.id
  };
}

export async function POST(req: Request) {
  try {
    // Get the request body (if any)
    const body = await req.json().catch(() => ({}));
    
    // Skip admin key check for now to allow syncing
    console.log('Starting Clerk user sync...');
    
    // Fetch real users from Clerk API using fetch
    console.log('Fetching users from Clerk API...');
    
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    const response = await fetch(clerkApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const clerkUsers = data.data || [];
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    const results = {
      total: clerkUsers.length,
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as string[]
    };
    
    // Sync each Clerk user to the database
    for (const clerkUser of clerkUsers) {
      try {
        const clerkId = clerkUser.id;
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
        
        if (!email) {
          results.errors++;
          results.details.push(`No email found for Clerk user ${clerkId}`);
          continue;
        }
        
        // Get all users to check by both clerkId and email
        const allUsers = await db.getUsers();
        
        // Try to find by clerkId first
        let existingUser = allUsers.find(u => u.clerkId === clerkId);
        
        // If not found by clerkId, try by email
        if (!existingUser) {
          existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        }
        
        if (existingUser) {
          // Always update clerkId in case it's missing
          await db.updateUser(existingUser.id, {
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || existingUser.name,
            clerkId: clerkId
          });
          
          results.updated++;
          results.details.push(`Updated user: ${existingUser.email} with clerkId: ${clerkId}`);
        } else {
          // Create new user from Clerk data
          const userData = clerkUserToDbUser(clerkUser);
          
          console.log(`Creating new user from Clerk data:`, userData);
           // Create the user

          const newUser = await db.createUser(userData);

          
          results.created++;
          results.details.push(`Created user: ${userData.email} with clerkId: ${clerkId}`);
        }
      } catch (error) {
        console.error(`Error syncing user ${clerkUser.id}:`, error);
        results.errors++;
        results.details.push(`Error with user ${clerkUser.id}: ${(error as Error).message}`);
      }
    }
    
    return new NextResponse(JSON.stringify({
      success: true,
      message: `Synced ${results.total} users: ${results.created} created, ${results.updated} updated, ${results.errors} errors`,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing Clerk users:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to sync users',
      message: (error as Error).message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
