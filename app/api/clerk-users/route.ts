import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to convert Clerk user to database user format
function clerkUserToDbUser(clerkUser: any) {
  console.log('Converting Clerk user to DB format:', clerkUser.id);
  
  // Handle different API response formats
  const firstName = clerkUser.first_name || clerkUser.firstName || '';
  const lastName = clerkUser.last_name || clerkUser.lastName || '';
  
  // Extract email from the first email address
  const emailObj = clerkUser.email_addresses?.[0] || clerkUser.emailAddresses?.[0] || {};
  const email = emailObj.email_address || emailObj.emailAddress || '';
  
  // Ensure role is either 'admin' or 'customer' based on organization roles
  // org:admin -> admin, org:member -> customer
  let role: 'admin' | 'customer' = 'customer';
  
  // Check for organization roles - handle different API response formats
  const orgMemberships = clerkUser.organization_memberships || clerkUser.organizationMemberships || [];
  console.log('Organization memberships:', JSON.stringify(orgMemberships));
  
  // Look for admin role in any organization
  let isAdmin = false;
  
  if (orgMemberships.length > 0) {
    isAdmin = orgMemberships.some((membership: any) => {
      const membershipRole = membership.role || '';
      console.log('Checking membership role:', membershipRole);
      return membershipRole === 'org:admin' || membershipRole === 'admin';
    });
  }
  
  if (isAdmin) {
    role = 'admin';
    console.log('User has admin role from organization membership');
  }
  
  // Fallback to publicMetadata if no org roles found or admin role not found
  const publicMetadata = clerkUser.public_metadata || clerkUser.publicMetadata || {};
  if ((!isAdmin || orgMemberships.length === 0) && publicMetadata?.role === 'admin') {
    role = 'admin';
    console.log('User has admin role from public metadata');
  }
  
  const userData = {
    name: `${firstName} ${lastName}`.trim() || 'Unnamed User',
    email: email,
    role: role,
    // We don't store passwords for Clerk users
    password: 'clerk-auth-user',
    // Store the Clerk user ID as a reference
    clerkId: clerkUser.id
  };
  
  console.log('Converted user data:', userData);
  return userData;
}

export async function GET() {
  try {
    
    // Fetch existing users from your database
    const existingUsers = await db.getUsers();
    
    // Fetch real users from Clerk API using fetch
    console.log('Fetching users from Clerk API...');
    console.log('Clerk Secret Key available:', !!process.env.CLERK_SECRET_KEY);
    
    // Use the correct Clerk API URL
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    console.log('Fetching users from Clerk API URL:', clerkApiUrl);
    
    const response = await fetch(clerkApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Clerk API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const clerkUsers = data.data || [];
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    // Format Clerk users for the frontend
    const formattedClerkUsers = clerkUsers.map((user: any) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddresses: user.emailAddresses,
      createdAt: user.createdAt,
      publicMetadata: user.publicMetadata,
      // Check if this user is already in your database
      inDatabase: existingUsers.some(dbUser => 
        dbUser.email === user.emailAddresses?.[0]?.emailAddress ||
        (dbUser as any).clerkId === user.id
      )
    }));
    
    return new NextResponse(JSON.stringify(formattedClerkUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Clerk users:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST endpoint to sync Clerk users to the database
export async function POST() {
  try {
    console.log('Starting user synchronization from Clerk to database...');
    
    // Fetch existing users from your database
    const existingUsers = await db.getUsers();
    console.log(`Found ${existingUsers.length} existing users in database`);
    
    // Fetch users from Clerk API
    console.log('Clerk Secret Key available:', !!process.env.CLERK_SECRET_KEY);
    
    // Use the correct Clerk API URL
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    console.log('Fetching users from Clerk API URL:', clerkApiUrl);
    
    const response = await fetch(clerkApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Clerk API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const clerkUsers = data.data || [];
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    // Track sync results
    const results = {
      total: clerkUsers.length,
      created: 0,
      updated: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Log the first user to see its structure
    if (clerkUsers.length > 0) {
      console.log('First Clerk user structure:', JSON.stringify(clerkUsers[0], null, 2));
    }
    
    // Process each Clerk user
    for (const clerkUser of clerkUsers) {
      try {
        // Extract email from the first email address
        const emailObj = clerkUser.email_addresses?.[0] || clerkUser.emailAddresses?.[0];
        const email = emailObj?.email_address || emailObj?.emailAddress;
        
        if (!email) {
          console.log(`Skipping user ${clerkUser.id} - no email address found`);
          results.details.push({
            id: clerkUser.id,
            status: 'skipped',
            reason: 'No email address found'
          });
          continue;
        }
        
        console.log(`Processing user: ${email}, id: ${clerkUser.id}`);
        console.log('User data:', {
          firstName: clerkUser.first_name || clerkUser.firstName,
          lastName: clerkUser.last_name || clerkUser.lastName,
          orgMemberships: clerkUser.organization_memberships || clerkUser.organizationMemberships || []
        });
        
        // Convert Clerk user to database format
        const userData = clerkUserToDbUser(clerkUser);
        console.log(`User converted to DB format: ${userData.email}, role: ${userData.role}`);
        
        // Check if user already exists in database
        const existingUser = existingUsers.find(user => user.email === email);
        
        if (existingUser) {
          // Update existing user
          console.log(`Updating existing user: ${existingUser.id}`);
          const updated = await db.updateUser(existingUser.id, {
            name: userData.name,
            role: userData.role
          });
          
          if (updated) {
            results.updated++;
            results.details.push({
              id: clerkUser.id,
              dbId: existingUser.id,
              email,
              status: 'updated'
            });
          } else {
            results.errors++;
            results.details.push({
              id: clerkUser.id,
              email,
              status: 'error',
              reason: 'Failed to update user'
            });
          }
        } else {
          // Create new user
          console.log(`Creating new user: ${email}`);
          const newUser = await db.createUser(userData);
          
          if (newUser) {
            results.created++;
            results.details.push({
              id: clerkUser.id,
              dbId: newUser.id,
              email,
              status: 'created'
            });
          } else {
            results.errors++;
            results.details.push({
              id: clerkUser.id,
              email,
              status: 'error',
              reason: 'Failed to create user'
            });
          }
        }
      } catch (error: any) {
        console.error(`Error processing user ${clerkUser.id}:`, error);
        results.errors++;
        results.details.push({
          id: clerkUser.id,
          status: 'error',
          reason: error?.message || 'Unknown error'
        });
      }
    }
    
    console.log('Sync completed with results:', {
      total: results.total,
      created: results.created,
      updated: results.updated,
      errors: results.errors
    });
    
    return new NextResponse(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error syncing users:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to sync users',
      message: error?.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
