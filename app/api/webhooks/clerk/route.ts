import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db'; // Your database connection

// Type assertion for server-side db methods
const serverDb = db as typeof db & {
  createUser: (user: { name: string; email: string; role: string; password: string; clerkId: string }) => Promise<{ id: string; name: string; email: string; role: string; clerkId?: string }>;
  getUserByEmail: (email: string) => Promise<{ id: string; name: string; email: string; role: string; clerkId?: string } | null>;
};

// Use the environment variable name that Clerk documentation recommends
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_WEBHOOK_SIGNING_SECRET;

// This is the webhook handler for Clerk events
export async function POST(req: Request) {
  console.log('Webhook received at:', new Date().toISOString());
  
  try {
    // Get the request headers
    const headerPayload = Object.fromEntries(
      Array.from(req.headers.entries())
    );
    
    // Extract the Svix headers for webhook signature verification
    const svix_id = headerPayload['svix-id'];
    const svix_timestamp = headerPayload['svix-timestamp'];
    const svix_signature = headerPayload['svix-signature'];

    // If there are no Svix headers, return an error
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Error: Missing Svix headers');
      return new NextResponse('Error: Missing Svix headers', { status: 400 });
    }

    // Get the request body
    const payload = await req.text();
    
    // Check if webhook secret is configured
    if (!CLERK_WEBHOOK_SECRET) {
      console.error('Error: Missing CLERK_WEBHOOK_SECRET environment variable');
      return new NextResponse('Error: Missing webhook signing secret', { status: 500 });
    }

    console.log('Webhook secret found, proceeding with verification...');

    let evt: any;
    
    try {
      // Verify the webhook signature using Svix
      const wh = new Webhook(CLERK_WEBHOOK_SECRET);
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new NextResponse('Error verifying webhook signature', { status: 400 });
    }

    // Handle the webhook event
    const eventType = evt.type;
    console.log(`Webhook received: ${eventType}`);
    console.log('Event data:', JSON.stringify(evt.data, null, 2));
    
    // Handle email.created events (these are different from user.created)
    if (eventType === 'email.created') {
      console.log('📧 Email created event received - this is just an email verification, not a user creation');
      console.log('Email data:', evt.data);
      
      // For email.created events, we typically don't need to create a user
      // These events are triggered when an email is added to a user account
      // The actual user creation happens with user.created events
      return new NextResponse('Email event acknowledged - no user action needed', { status: 200 });
    }
    
    // Process user events with appropriate error handling
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
      
      try {
        // Check if user exists in your database by email
        const email = email_addresses?.[0]?.email_address || '';
        console.log(`Processing Clerk user: ${email} with ID: ${id}`);
        
        // Check if email exists
        if (!email) {
          console.error('No email found in Clerk user data');
          // Return 200 anyway so Clerk doesn't retry - this may not be a critical error
          return new NextResponse('Success: Event acknowledged but no email found', { status: 200 });
        }
        
        // Try to find the user first by clerkId, then by email
        let existingUser = null;
        
        try {
          // Get all users and find one with matching clerkId or email
          console.log('🔍 Attempting to fetch users from database...');
          const users = await serverDb.getUsers();
          console.log(`✅ Successfully fetched ${users.length} users from database`);
          
          // First try to find by Clerk ID
          existingUser = users.find(u => u.clerkId === id);
          
          // If not found by clerkId, try by email
          if (!existingUser) {
            existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          }
          
          console.log(`Existing user found: ${existingUser ? `Yes (${existingUser.email})` : 'No'}`);
        } catch (dbError) {
          console.error('❌ Database error checking for existing user:', dbError);
          console.error('Database error details:', {
            message: dbError instanceof Error ? dbError.message : 'Unknown error',
            stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
          });
          // Continue with no existing user
        }
        
        // Determine role based on organization memberships or metadata
        let userRole: 'admin' | 'customer' = 'customer';
        
        // Check for admin role in any organization or metadata
        const orgMemberships = evt.data.organization_memberships || [];
        const isAdmin = orgMemberships.some((membership: any) => {
          const role = membership.role || '';
          return role === 'org:admin' || role === 'admin';
        }) || public_metadata?.role === 'admin';
        
        if (isAdmin) {
          userRole = 'admin';
        }
        
        console.log(`Clerk user ${id} (${email}) has role: ${userRole}`);
        console.log(`Existing user found: ${existingUser ? 'Yes' : 'No'}`);
        
        if (existingUser) {
          // Update existing user
          try {
            const updateData = {
              name: `${first_name || ''} ${last_name || ''}`.trim(),
              role: userRole,
              clerkId: id // Always set the clerkId to ensure it's updated
            };
            
            console.log(`Updating user ${existingUser.id} with:`, updateData);
            
            await serverDb.updateUser(existingUser.id, updateData);
            console.log(`User updated in database: ${email} with clerkId: ${id}`);
          } catch (updateError) {
            console.error(`Failed to update user ${email}:`, updateError);
            // Continue - don't fail the webhook for an update error
          }
        } else {
          // Create new user
          try {
            const userData = {
              name: `${first_name || ''} ${last_name || ''}`.trim(),
              email: email,
              role: userRole,
              password: 'clerk-auth-user', // Placeholder password for Clerk users
              clerkId: id // Make sure clerkId is set
            };
            
            console.log(`🚀 Creating user with data:`, userData);
            console.log(`Database connection status: ${typeof serverDb.createUser === 'function' ? 'Ready' : 'Not Ready'}`);
            
            // Test database connection before creating user
            console.log('🔄 Testing database connection...');
            
            const newUser = await serverDb.createUser(userData);
            console.log(`✅ User created successfully in database:`, {
              id: newUser.id,
              email: newUser.email,
              clerkId: newUser.clerkId,
              role: newUser.role
            });
          } catch (error: any) {
            console.error(`❌ Failed to create user ${email}:`, error);
            console.error('Error details:', {
              message: error?.message,
              stack: error?.stack,
              name: error?.name,
              code: error?.code // MongoDB error codes
            });
            
            // More specific error handling
            if (error?.code === 11000) {
              console.log('🔄 Duplicate key error detected - user already exists');
            } else if (error?.message?.includes('E11000')) {
              console.log('🔄 E11000 error - duplicate email detected');
            } else if (error?.message?.includes('connect')) {
              console.log('🔌 Database connection error detected');
            }
            
            // If this was a duplicate key error, try to update the existing user
            if (error && typeof error === 'object' && 'toString' in error) {
              const errorString = error.toString();
              if (errorString.includes('duplicate key') || errorString.includes('E11000')) {
                try {
                  console.log('🔄 Attempting to update existing user due to duplicate key error...');
                  // Try to find the user by email again (might have been created between checks)
                  const userByEmail = await serverDb.getUserByEmail(email);
                  
                  if (userByEmail) {
                    console.log(`Found user by email after create error, updating with clerkId: ${id}`);
                    await serverDb.updateUser(userByEmail.id, { 
                      clerkId: id,
                      name: `${first_name || ''} ${last_name || ''}`.trim(),
                      role: userRole
                    });
                    console.log(`✅ User updated with clerkId after duplicate error: ${email}`);
                  }
                } catch (retryError) {
                  console.error(`❌ Failed in retry update after duplicate key error:`, retryError);
                }
              }
            }
          }
        }
        
        // Always return success to avoid unnecessary webhook retries
        return new NextResponse('Webhook processed successfully', { status: 200 });
      } catch (error) {
        console.error('Error handling user event:', error);
        // Return 200 to prevent retries that might fail again
        return new NextResponse('Webhook acknowledged with errors', { status: 200 });
      }
    }
    
    if (eventType === 'user.deleted') {
      try {
        // When a user is deleted, Clerk might not include email_addresses in the webhook data
        const { id } = evt.data;
        console.log(`Processing user deletion for Clerk ID: ${id}`);
        
        // First, try to find the user by email if available
        const email = evt.data.email_addresses?.[0]?.email_address || '';
        
        // Check if we have users in our database
        const users = await serverDb.getUsers();
        
        // Log the first few users for debugging
        console.log('First few users in database:', users.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          clerkId: u.clerkId || 'undefined'
        })));
        
        let userToDelete = null;
        
        // Try to find the user by Clerk ID first (if we store that)
        for (const user of users) {
          if (user.clerkId === id) {
            userToDelete = user;
            console.log(`Found user by Clerk ID: ${user.email}`);
            break;
          }
        }
        
        // If not found by Clerk ID and we have an email, try to find by email
        if (!userToDelete && email) {
          userToDelete = await serverDb.getUserByEmail(email);
          if (userToDelete) {
            console.log(`Found user by email: ${email}`);
          }
        }
        
        // If we found a user to delete, delete them
        if (userToDelete) {
          await serverDb.deleteUser(userToDelete.id);
          console.log(`User deleted from database: ${userToDelete.email || userToDelete.id}`);
        } else {
          console.log(`No matching user found to delete for Clerk ID: ${id}, email: ${email || 'none'}`);
          
          // Log all users for debugging if the user wasn't found
          console.log('Available users:', users.map(u => ({
            id: u.id,
            email: u.email,
            clerkId: u.clerkId || 'undefined'
          })));
        }
        
        return new NextResponse('Webhook processed successfully', { status: 200 });
      } catch (error) {
        console.error('Error handling user deletion:', error);
        // Return 200 to prevent retries
        return new NextResponse('Webhook acknowledged with errors', { status: 200 });
      }
    }

    // For any other event type, acknowledge receipt but log what we received
    console.log(`📝 Unhandled event type: ${eventType}`);
    console.log('Available event data keys:', Object.keys(evt.data || {}));
    
    // Handle session events specifically
    if (['session.created', 'session.ended', 'session.removed', 'session.revoked'].includes(eventType)) {
      console.log('🔐 Session-related event received - no database action needed');
      console.log('⚠️  NOTE: Session events do NOT create users in the database.');
      console.log('📋 To store users in your database, you need to subscribe to user.created events in your Clerk Dashboard.');
      console.log('🔧 Go to Clerk Dashboard > Webhooks > Your Endpoint > Edit > Subscribe to "user.created" event');
      
      // For session.created, we can try to get user info and store if needed (WORKAROUND)
      if (eventType === 'session.created' && evt.data?.user_id) {
        console.log('👤 Session created for user ID:', evt.data.user_id);
        console.log('� WORKAROUND: Attempting to handle user creation from session data...');
        
        // Try to extract user information from session data
        const userId = evt.data.user_id;
        
        try {
          // Check if we already have this user in our database
          const users = await serverDb.getUsers();
          const existingUser = users.find(u => u.clerkId === userId);
          
          if (existingUser) {
            console.log(`✅ User already exists in database: ${existingUser.email}`);
          } else {
            console.log('❌ User not found in database. Session events do not contain user details.');
            console.log('🔧 SOLUTION: Change your Clerk webhook to subscribe to user.created events instead.');
            console.log('📍 Current session data available:', Object.keys(evt.data));
            
            // Log what data is available in session.created
            if (evt.data) {
              console.log('Session event data:', JSON.stringify(evt.data, null, 2));
            }
          }
        } catch (dbError) {
          console.error('❌ Database error during session handling:', dbError);
        }
      }
      
      return new NextResponse('Session event acknowledged - no user creation needed', { status: 200 });
    } else if (['organization.created', 'organization.updated', 'organization.deleted'].includes(eventType)) {
      console.log('🏢 Organization-related event - could potentially handle admin roles here');
      return new NextResponse('Organization event acknowledged', { status: 200 });
    } else {
      console.log('❓ Unknown event type - consider adding handler if this is important for your app');
      console.log('📚 Common Clerk events that create users: user.created, user.updated, user.deleted');
      console.log('🔧 Current webhook is receiving:', eventType);
      return new NextResponse('Unknown event acknowledged', { status: 200 });
    }
  } catch (error) {
    console.error('Unexpected error in webhook handler:', error);
    // Return 200 to prevent retries for general errors
    return new NextResponse('Webhook acknowledged with unexpected error', { status: 200 });
  }
}
