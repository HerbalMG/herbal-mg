# SMS Setup Guide

## Current Status
✅ SMS integration is ready with 2Factor API
✅ OTP is logged to console in development mode
✅ SMS will be sent in production mode

## How It Works

### Development Mode (Current)
- OTP is logged to backend console
- OTP is returned in API response for testing
- No SMS is actually sent
- Perfect for local development

### Production Mode
- SMS is sent via 2Factor API
- OTP is NOT returned in API response
- OTP is only sent to user's mobile
- Secure and production-ready

## Enable SMS Sending

### Option 1: Test SMS in Development

To test SMS sending even in development, update your `.env`:

```env
NODE_ENV=production
TWO_FACTOR_API_KEY=d6738f81-a4f5-11f0-b922-0200cd936042
```

Then restart the server:
```bash
cd backend
npm start
```

### Option 2: Keep Development Mode

Keep current setup for local testing:
```env
NODE_ENV=development
TWO_FACTOR_API_KEY=d6738f81-a4f5-11f0-b922-0200cd936042
```

OTP will continue to show in console.

## 2Factor API Details

Your 2Factor API key is already configured in `.env`:
```
TWO_FACTOR_API_KEY=d6738f81-a4f5-11f0-b922-0200cd936042
```

### API Endpoint Used
```
https://2factor.in/API/V1/{API_KEY}/SMS/{MOBILE}/{OTP}
```

### Example Request
```
GET https://2factor.in/API/V1/d6738f81-a4f5-11f0-b922-0200cd936042/SMS/9876543210/123456
```

### Response Format
```json
{
  "Status": "Success",
  "Details": "OTP sent successfully"
}
```

## Testing SMS Delivery

### 1. Update Environment
```bash
# In backend/.env
NODE_ENV=production
```

### 2. Restart Server
```bash
cd backend
npm start
```

### 3. Test Login
1. Go to http://localhost:5173/login
2. Enter your mobile number
3. Click "Send OTP"
4. Check your phone for SMS
5. Enter OTP and verify

### 4. Check Logs
Backend console will show:
```
SMS sent successfully to 9876543210
```

Or if failed:
```
SMS sending failed: {error details}
```

## Troubleshooting

### SMS Not Received

1. **Check API Key**
   - Verify your 2Factor API key is valid
   - Login to https://2factor.in/
   - Check your account balance

2. **Check Mobile Number**
   - Must be 10 digits
   - Must start with 6, 7, 8, or 9
   - No country code needed

3. **Check API Response**
   - Look at backend console logs
   - Check for error messages

4. **Test API Directly**
   ```bash
   curl "https://2factor.in/API/V1/d6738f81-a4f5-11f0-b922-0200cd936042/SMS/9876543210/123456"
   ```

### API Key Issues

If your API key is invalid or expired:

1. Login to https://2factor.in/
2. Get a new API key
3. Update `.env`:
   ```
   TWO_FACTOR_API_KEY=your_new_key_here
   ```
4. Restart server

### Balance Issues

2Factor requires credits to send SMS:
1. Login to your 2Factor account
2. Check your balance
3. Recharge if needed

## Alternative SMS Providers

If you want to use a different SMS provider, update the `sendOtp` function in `backend/controllers/otpAuthController.js`:

### Twilio
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: `Your OTP is: ${otp}`,
  from: '+1234567890',
  to: `+91${mobile}`
});
```

### MSG91
```javascript
await axios.get('https://api.msg91.com/api/v5/otp', {
  params: {
    authkey: 'YOUR_AUTH_KEY',
    mobile: mobile,
    otp: otp
  }
});
```

### Fast2SMS
```javascript
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

## Current Implementation

The code automatically:
- ✅ Generates 6-digit OTP
- ✅ Stores OTP with 5-minute expiry
- ✅ Sends SMS in production mode
- ✅ Logs OTP in development mode
- ✅ Returns OTP in response (dev only)
- ✅ Handles SMS API errors gracefully

## Security Notes

1. **Never log OTP in production**
   - Current code only logs in development
   - Production mode hides OTP

2. **Rate Limiting**
   - Consider adding rate limiting
   - Prevent OTP spam/abuse

3. **OTP Expiry**
   - Current: 5 minutes
   - Adjust in code if needed

4. **Session Security**
   - Sessions expire after 30 days
   - Tokens are cryptographically secure

## Summary

- 🔧 SMS integration is ready
- 📱 Change `NODE_ENV=production` to enable SMS
- 🔐 OTP shows in console for development
- ✅ No code changes needed
- 🚀 Just update .env and restart!
