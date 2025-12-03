# 2FA SMS Login Backend

A Node.js backend service for handling 2-factor authentication via SMS.

## Features

- Name + Mobile number login
- OTP generation and validation
- Multiple SMS provider support (Twilio, TextLocal, MSG91, Generic API)
- Rate limiting and security measures
- RESTful API endpoints

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your SMS provider credentials
   ```

3. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## SMS Provider Configuration

Choose one of the following SMS providers and configure in `.env`:

### Option 1: Twilio
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### Option 2: TextLocal (India)
```env
TEXTLOCAL_API_KEY=your_api_key
TEXTLOCAL_SENDER=TXTLCL
```

### Option 3: MSG91 (India)
```env
MSG91_AUTH_KEY=your_auth_key
MSG91_TEMPLATE_ID=your_template_id
```

### Option 4: Generic SMS API
```env
SMS_API_URL=https://your-provider.com/api/send
SMS_API_KEY=your_api_key
```

## API Endpoints

### POST /api/auth/send-otp
Send OTP to mobile number
```json
{
  "name": "John Doe",
  "mobile": "9876543210"
}
```

### POST /api/auth/verify-otp
Verify OTP and complete login
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "otp": "123456"
}
```

### POST /api/auth/resend-otp
Resend OTP to mobile number
```json
{
  "mobile": "9876543210"
}
```

## Security Features

- OTP expires in 5 minutes
- Maximum 3 verification attempts
- Mobile number validation
- Rate limiting (implement as needed)

## Development

The server runs on `http://localhost:3001` by default.

Health check: `GET /health`