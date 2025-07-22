import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// This route helps sync existing users with their corresponding Clerk IDs
export async function POST(req: Request) {
  try {
    // Simple admin key check for security
    const body = await req.json().catch(() => ({}));
    const adminKey = body.adminKey || '';
    
    // Simple security check - you should use a more robust solution in production
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Starting Clerk ID sync for existing users...');
    
    // 1. Get all users from our database
    const databaseUsers = await db.getUsers();
    console.log(`Found ${databaseUsers.length} users in database`);
    
    // 2. Fetch all users from Clerk API
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
    const CLERK_API_URL = 'https://api.clerk.com/v1';
    
    if (!CLERK_SECRET_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Clerk API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const response = await fetch(`${CLERK_API_URL}/users`, {
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
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    // 3. Create a map of email to Clerk user ID
    const emailToClerkId = new Map();
    
    for (const clerkUser of clerkUsers) {
      const emails = clerkUser.email_addresses || [];
      if (emails.length > 0) {
        const primaryEmail = emails[0].email_address;
        if (primaryEmail) {
          emailToClerkId.set(primaryEmail.toLowerCase(), clerkUser.id);
        }
      }
    }
    
    // 4. Update each database user with the corresponding Clerk ID
    let updatedCount = 0;
    const results = [];
    
    for (const dbUser of databaseUsers) {
      // Skip users that already have a Clerk ID
      if (dbUser.clerkId) {
        results.push(`User ${dbUser.email} already has Clerk ID: ${dbUser.clerkId}`);
        continue;
      }
      
      // Find the corresponding Clerk ID
      const clerkId = emailToClerkId.get(dbUser.email.toLowerCase());
      
      if (clerkId) {
        // Update the user with the Clerk ID
        await db.updateUser(dbUser.id, { clerkId });
        updatedCount++;
        results.push(`Updated user ${dbUser.email} with Clerk ID: ${clerkId}`);
      } else {
        results.push(`No Clerk user found for ${dbUser.email}`);
      }
    }
    
    console.log(`Updated ${updatedCount} users with Clerk IDs`);
    
    return new NextResponse(JSON.stringify({
      success: true,
      message: `Updated ${updatedCount} of ${databaseUsers.length} users with Clerk IDs`,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing Clerk IDs:', error);
    
    return new NextResponse(JSON.stringify({
      error: 'Failed to sync Clerk IDs',
      message: (error as Error).message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 