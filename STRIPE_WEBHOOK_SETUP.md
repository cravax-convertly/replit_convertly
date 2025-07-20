# Stripe Webhook Implementation

This document describes the Stripe webhook implementation for upgrading users to premium status when they complete payment.

## Overview

The system listens for `checkout.session.completed` events from Stripe and automatically upgrades users to premium status in the Replit Database.

## Environment Variables Required

```bash
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your Stripe webhook secret
```

## API Endpoints

### `POST /api/stripe-webhook`

Handles Stripe webhook events, specifically `checkout.session.completed`.

**Process:**
1. Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
2. Extracts customer email from `event.data.object.customer_email`
3. Looks up user in Replit DB using email index
4. Updates user record with `isPremium: true`
5. Logs success/failure to console

**Response:**
- `200` - Success, user upgraded
- `400` - Invalid signature or missing email
- `404` - User not found
- `500` - Server error

### `POST /api/test-upgrade`

Manual testing endpoint to upgrade a user to premium.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test upgrade successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser",
    "isPremium": true
  }
}
```

### `POST /api/test-create-user`

Development endpoint to create test users.

**Request:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

## Database Structure

Users are stored in Replit DB with the following structure:

- `user:{id}` - User record
- `email:{email}` - Email to user ID index
- `username:{username}` - Username to user ID index

## Testing

1. **Create Test User:**
   ```bash
   curl -X POST http://localhost:5000/api/test-create-user \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

2. **Test Upgrade:**
   ```bash
   curl -X POST http://localhost:5000/api/test-upgrade \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **Check Database Stats:**
   ```bash
   curl http://localhost:5000/api/db-stats
   ```

## Console Logging

The system provides clear console logging:

- `🔔 Stripe webhook received`
- `✅ Stripe webhook signature verified successfully`
- `🎉 Processing checkout.session.completed event`
- `📧 Customer email: user@example.com`
- `✅ Successfully upgraded user to premium`
- `❌ Error messages for failures`

## Error Handling

- **Missing Environment Variables:** Returns 500 error
- **Invalid Signature:** Returns 400 error
- **Missing Customer Email:** Returns 400 error
- **User Not Found:** Returns 404 error
- **Database Errors:** Returns 500 error

## Security

- Stripe signature verification prevents unauthorized webhook calls
- Environment variables keep secrets secure
- User lookup by email prevents unauthorized upgrades
- Proper error handling prevents information leakage

## Production Setup

1. Set environment variables in Replit Secrets
2. Configure Stripe webhook endpoint URL
3. Select `checkout.session.completed` events
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`
5. Test webhook with real Stripe checkout

## Integration with Existing System

The webhook integrates seamlessly with:
- Existing Replit Database user storage
- Email-based user lookup system
- Premium user tracking (`isPremium` flag)
- Database statistics endpoints