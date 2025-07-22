# Clerk Webhook Handler

This webhook handler processes events from Clerk authentication service and syncs user data with your database.

## Setup Instructions

1. Install the Svix package for webhook verification:
```bash
npm install svix
```

2. Set up your environment variables in Vercel:
```
CLERK_WEBHOOK_SIGNING_SECRET=your_webhook_signing_secret
```

3. In the Clerk dashboard, set up a webhook endpoint pointing to:
```
https://your-domain.com/api/webhooks/clerk
```

4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

## Vercel Deployment Troubleshooting

If your webhooks are failing in production, check the following:

1. **Environment Variables**: Ensure `CLERK_WEBHOOK_SIGNING_SECRET` is set in Vercel.

2. **Function Timeout**: Webhook functions must complete in under 10s on Vercel's Hobby plan.
   - Consider minimizing database operations in the webhook handler
   - Use serverless-friendly database queries

3. **Webhook Status Codes**: 
   - Always return HTTP 200 for successfully processed webhooks
   - Return 4xx only when the webhook is invalid and should NOT be retried
   - This handler deliberately returns 200 for most errors to prevent unnecessary retries

4. **Monitoring**:
   - Check Vercel function logs for detailed error messages
   - Monitor webhook events in the Clerk Dashboard (Developer > Webhooks > Instance > Message Attempts)

5. **Database Connection Issues**:
   - Ensure your database connection is properly configured for serverless environments
   - Consider connection pooling for MongoDB in serverless functions

## Debugging Tips

1. Add temporary logging and deploy to Vercel:
```typescript
console.log('Webhook headers:', JSON.stringify(headerPayload));
console.log('Webhook body:', evt);
```

2. In Vercel, navigate to:
   - Deployments > Latest deployment > Functions tab
   - Find `/api/webhooks/clerk` and check the logs

3. In Clerk Dashboard:
   - Navigate to Webhooks > Your Endpoint > Message Attempts
   - Check failure messages and HTTP status codes

## Security

The webhook handler verifies incoming requests using the Svix library and your webhook secret. Never expose your webhook secret in your code.

## Event Handling

This handler processes the following events:
- When users are created in Clerk, they are added to your database
- When users are updated in Clerk, their information is updated in your database
- When users are deleted in Clerk, they are removed from your database

## Troubleshooting

Check the server logs for any webhook processing errors. Common issues include:
- Missing webhook secret
- Incorrect webhook URL configuration
- Network connectivity problems

For more information, see the [Clerk Webhooks Documentation](https://clerk.com/docs/users/sync-data-to-your-backend).
