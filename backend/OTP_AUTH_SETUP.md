# OTP Authentication Setup

## Overview
This document describes the OTP-based authentication system for customer login.

## API Endpoints

### 1. Send OTP
**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**
```json
{
  "mobile": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "123456"  // Only in development mode
}
```

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "isNewUser": false,
  "userId": "123",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer"
  },
  "token": "session_token_here"
}
```

## Database Migration

Run the migration to add mobile column to users table:

```sql
-- Run this in your database
\i backend/migrations/add_mobile_to_users.sql
```

Or manually execute:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

## SMS Integration (TODO)

Currently, OTP is logged to console. To integrate with SMS service:

1. **Twilio:**
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: `Your OTP is: ${otp}`,
  from: '+1234567890',
  to: `+91${mobile}`
});
```

2. **MSG91:**
```javascript
const axios = require('axios');

await axios.get('https://api.msg91.com/api/v5/otp', {
  params: {
    authkey: 'YOUR_AUTH_KEY',
    mobile: mobile,
    otp: otp
  }
});
```

3. **Fast2SMS:**
```javascript
const axios = require('axios');

await axios.post('https://www.fast2sms.com/dev/bulkV2', {
  route: 'otp',
  sender_id: 'FSTSMS',
  message: otp,
  variables_values: otp,
  flash: 0,
  numbers: mobile
}, {
  headers: {
    'authorization': 'YOUR_API_KEY'
  }
});
```

## Security Considerations

1. **OTP Storage:** Currently using in-memory Map. For production:
   - Use Redis for distributed systems
   - Set proper TTL (5 minutes)
   - Implement rate limiting

2. **Rate Limiting:** Add rate limiting to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many OTP requests, please try again later'
});

router.post('/send-otp', otpLimiter, otpAuthController.sendOtp);
```

3. **OTP Attempts:** Limit verification attempts (3-5 max)

4. **Session Management:** 
   - Store sessions in database
   - Implement token refresh mechanism
   - Add logout functionality

## Frontend Integration

The login page is already connected. It will:
1. Send OTP to the mobile number
2. Verify the OTP
3. Store user data and token in localStorage
4. Redirect to profile (new users) or home (existing users)

## Testing

For development, OTP is returned in the API response. In production, remove this:

```javascript
// In otpAuthController.js
res.json({
  success: true,
  message: 'OTP sent successfully',
  // Remove this line in production:
  otp: process.env.NODE_ENV === 'development' ? otp : undefined
});
```

## Environment Variables

Add to `.env`:
```
NODE_ENV=development
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
```
