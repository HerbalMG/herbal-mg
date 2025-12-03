# Migration Guide: Customer Authentication System

This guide covers the migration from the old authentication system to the new customer-based authentication system.

## Overview

The system has been restructured to separate admin users from customers:
- **Admin users**: Stored in `users` table, authenticated via `/api/login`
- **Customers**: Stored in `customer` table, authenticated via OTP at `/api/auth/send-otp` and `/api/auth/verify-otp`

## Database Migrations

### Step 1: Separate Users and Customers Tables

Run the migration script to create the customer table and session management:

```bash
node backend/migrations/separate_users_customers.js
```

This will:
- Create `customer` table with fields: id, name, email, mobile, is_active, created_at, updated_at, last_login
- Create `customer_session` table for managing customer authentication tokens
- Migrate existing users with mobile numbers to the customer table
- Keep admin users in the users table

### Step 2: Add Address Contact Fields

Run this SQL migration in your Supabase SQL editor:

```bash
# Copy the contents of backend/migrations/add_address_contact_fields.sql
# and run it in Supabase SQL Editor
```

This adds:
- `full_name` VARCHAR(255) - Customer name for this address
- `email` VARCHAR(255) - Contact email for this address
- `contact` VARCHAR(20) - Contact phone number for this address

## Backend Changes

### New Files Created

1. **Error Handling System**
   - `backend/utils/ApiError.js` - Standardized error class
   - `backend/utils/ApiResponse.js` - Standardized response formatter
   - `backend/utils/catchAsync.js` - Async error wrapper
   - `backend/middleware/errorHandler.js` - Centralized error handling

2. **Customer Authentication**
   - `backend/middleware/customerAuth.js` - Customer authentication middleware
   - `backend/controllers/otpAuthController.js` - OTP authentication logic
   - `backend/routes/otpAuthRoutes.js` - Customer auth routes

3. **Address Management**
   - `backend/controllers/addressController.js` - Updated with new fields
   - `backend/routes/customerAddressRoutes.js` - Customer-specific address routes

### Updated Files

- `backend/app.js` - Added error handling middleware and new routes
- `backend/server.js` - Added graceful shutdown handlers

## Frontend Changes

### Updated Components

1. **Login Component** (`frontend/src/pages/Login/Login.jsx`)
   - Removed name field (auto-set to 'User' for new customers)
   - Integrated OTP authentication flow
   - Proper token and user data storage

2. **Profile Form** (`frontend/src/components/ProfileForm.jsx`)
   - Complete rewrite for customer authentication
   - Profile completion section for new users
   - Address management with full contact details
   - Proper error handling and validation

3. **User Profile Page** (`frontend/src/pages/UserProfile.jsx`)
   - Updated to use new ProfileForm component

## API Endpoints

### Customer Authentication

```
POST /api/auth/send-otp
Body: { mobile: "9876543210" }
Response: { success: true, otp: "123456" } // otp only in development

POST /api/auth/verify-otp
Body: { mobile: "9876543210", otp: "123456" }
Response: {
  success: true,
  data: {
    isNewUser: true/false,
    user: { id, name, email, mobile },
    token: "session_token",
    expiresAt: "2024-12-17T..."
  }
}

GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, data: { id, name, email, mobile, ... } }

PUT /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Body: { name: "John Doe", email: "john@example.com" }
Response: { success: true, data: { id, name, email, mobile } }

POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, message: "Logged out successfully" }
```

### Address Management

```
GET /api/customers/:customerId/addresses
Headers: { Authorization: "Bearer <token>" }
Response: { success: true, data: [...addresses] }

POST /api/customers/:customerId/addresses
Headers: { Authorization: "Bearer <token>" }
Body: {
  full_name: "John Doe",
  email: "john@example.com",
  contact: "9876543210",
  address_line1: "123, Main St, Near Park",
  address_line2: "",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  country: "India",
  is_default: false
}

PUT /api/customers/:customerId/addresses/:addressId
Headers: { Authorization: "Bearer <token>" }
Body: { ...same as POST }

DELETE /api/customers/:customerId/addresses/:addressId
Headers: { Authorization: "Bearer <token>" }

POST /api/customers/:customerId/addresses/:addressId/set-default
Headers: { Authorization: "Bearer <token>" }
```

## Environment Variables

Add to your `.env` file:

```env
# OTP Service (2Factor.in)
TWO_FACTOR_API_KEY=your_api_key_here

# Node Environment
NODE_ENV=development  # or 'production'
```

## Testing the Migration

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test OTP Login:**
   - Go to login page
   - Enter mobile number
   - Check console for OTP (in development mode)
   - Enter OTP to login
   - New users will see "User" as name initially

4. **Test Profile Update:**
   - After login, go to profile page
   - Update name and email
   - Verify changes persist

5. **Test Address Management:**
   - Add a new address with all fields
   - Edit an existing address
   - Set default address
   - Delete an address

## Rollback Plan

If you need to rollback:

1. Keep the old `users` table intact (migration doesn't delete it)
2. Switch frontend back to old login component
3. Use old authentication endpoints
4. The `customer` table can coexist without affecting old system

## Security Notes

1. **OTP Storage**: Currently using in-memory Map. For production, use Redis.
2. **Session Management**: Tokens stored in `customer_session` table with expiry.
3. **Authorization**: Customer can only access their own data (enforced by middleware).
4. **HTTPS**: Always use HTTPS in production for token transmission.

## Support

For issues or questions, check:
- `backend/BACKEND_STRUCTURE.md` - Backend architecture documentation
- Console logs for detailed error messages
- Network tab for API request/response details
