# 🚀 Clerk Webhook Setup Fix Guide

## The Problem
You're receiving `session.created` events but no users are being created in your database. This is because:

1. `session.created` events are **NOT** user creation events - they happen when users sign in
2. `email.created` events are **NOT** user creation events - they're just email verification events  
3. You need to subscribe to `user.created` events to actually capture new user registrations

## Current Issue Analysis
Based on your logs showing `session.created` events, your webhook is configured incorrectly.

**❌ What you're currently receiving:**
- `session.created` - Happens when user signs in (doesn't create users in DB)
- `email.created` - Happens during email verification (doesn't create users in DB)

**✅ What you need to receive:**
- `user.created` - Happens when new user registers (this creates users in DB)
- `user.updated` - Happens when user info changes
- `user.deleted` - Happens when user is deleted

## Quick Fix Steps

### 1. Update Clerk Webhook Configuration

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Find your webhook endpoint (pointing to `https://westernstreet.vercel.app/api/webhooks/clerk`)
4. **Edit the webhook subscription events:**

   **✅ Subscribe to these events:**
   - `user.created` ← **This is the most important one!**
   - `user.updated`
   - `user.deleted`

   **❌ Unsubscribe from these events:**
   - `session.created` ← **Remove this one - it's causing your current issue**
   - `session.ended`
   - `email.created` ← **Remove this one too**
   - `email.updated`
   - Any other session or email-related events

5. Save the webhook configuration

### 2. Verify Environment Variables

Make sure your Vercel deployment has this environment variable set:

```
CLERK_WEBHOOK_SECRET=your_actual_webhook_secret_from_clerk_dashboard
```

**Important:** Get this value from your Clerk Dashboard > Webhooks > Your Endpoint > Signing Secret

### 3. Test the Fix

1. **Create a completely new user account** (don't just sign in with existing account)
2. Go through the full registration process
3. Check your Vercel function logs for:
   ```
   Webhook received: user.created
   ✅ User created successfully in database
   ```

### 4. Monitor the Logs

#### In Vercel:
1. Go to your Vercel dashboard
2. Navigate to Functions tab
3. Find `/api/webhooks/clerk`
4. Check the latest logs

#### In Clerk Dashboard:
1. Go to Webhooks > Your Endpoint
2. Check "Message Attempts" tab
3. Look for successful `user.created` events

## Expected Behavior After Fix

### ✅ Good Logs (What you should see):
```
Webhook received: user.created
Processing Clerk user: user@example.com with ID: user_xxxxx
🔍 Attempting to fetch users from database...
✅ Successfully fetched X users from database
Existing user found: No
🚀 Creating user with data: { name: "John Doe", email: "user@example.com", ... }
✅ User created successfully in database
```

### ❌ Bad Logs (What you're currently seeing):
```
Webhook received: session.created
🔐 Session-related event received - no database action needed
⚠️  NOTE: Session events do NOT create users in the database.
📋 To store users in your database, you need to subscribe to user.created events
```

OR

```
Webhook received: email.created
📧 Email created event received - this is just an email verification, not a user creation
Email event acknowledged - no user action needed
```

## Troubleshooting

### If you still don't see `user.created` events:

1. **Check if users already exist in Clerk:**
   - If users were created before setting up webhooks, you won't get `user.created` events for them
   - Only **new** user registrations trigger `user.created`

2. **Test with a brand new email:**
   - Use an email that has never been used with your Clerk app
   - Go through the complete signup process

3. **Check webhook URL:**
   - Ensure it's pointing to: `https://westernstreet.vercel.app/api/webhooks/clerk`
   - Make sure it's accessible from the internet

### If users are created but not saved to database:

1. **Check MongoDB connection:**
   - Verify `MONGODB_URI` environment variable in Vercel
   - Check if MongoDB Atlas allows connections from Vercel IPs

2. **Check database errors in logs:**
   - Look for connection timeouts
   - Check for duplicate key errors

## Quick Test Command

To test if your webhook is properly configured, you can use this curl command:

```bash
curl -X POST https://westernstreet.vercel.app/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test" \
  -d '{"type": "test", "data": {}}'
```

This should return a 400 error (because of invalid signature), but confirms the endpoint is reachable.

---

**Need help?** Check the updated webhook logs after making these changes, and you should see actual user creation events!
