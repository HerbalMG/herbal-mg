# Authentication System Migration Guide

## 🎯 Overview

The authentication system has been restructured to separate admin users from customers:

- **Admin Users** (`users` table): Admin and limited_admin only, authenticated via username/password
- **Customers** (`customer` table): Regular users authenticated via OTP (mobile number)

## 📊 What Changed

### Backend Changes

#### 1. Database Structure

**Before:**
```sql
users table:
- Contains all users (admin, limited_admin, customers)
- Has mobile column
- Mixed authentication methods
```

**After:**
```sql
users table:
- Only admin and limited_admin
- No mobile column
- Password-based authentication only

customer table:
- All regular customers
- Mobile number required
- OTP-based authentication

customer_session table:
- Customer authentication sessions
- Replaces admin_login for customers
```

#### 2. Authentication Endpoints

**Admin Authentication** (unchanged):
```
POST /api/login          - Admin login with username/password
POST /api/logout         - Admin logout
```

**Customer Authentication** (updated):
```
POST /api/auth/send-otp     - Send OTP to mobile
POST /api/auth/verify-otp   - Verify OTP and login
GET  /api/auth/profile      - Get customer profile (protected)
PUT  /api/auth/profile      - Update customer profile (protected)
POST /api/auth/logout       - Customer logout (protected)
```

#### 3. Middleware

**New Middleware:**
- `customerAuth` - Authenticates customers via customer_session
- `optionalCustomerAuth` - Optional customer authentication

**Updated Middleware:**
- `adminAuth` - Now only checks admin_login table for admin users

#### 4. Response Format

**Old Format:**
```json
{
  "success": true,
  "message": "Login successful",
  "userId": 123,
  "user": { ... },
  "token": "..."
}
```

**New Format (standardized):**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210"
    },
    "token": "...",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

### Frontend Changes

#### 1. Login Component

**Added:**
- Name field for new users (optional)
- Better error handling with toast notifications
- Support for both old and new response formats
- Resend OTP functionality with timer

**Updated:**
- Now sends `name` field in verify-otp request
- Handles new response structure
- Better UX with loading states

#### 2. User Data Storage

**localStorage structure remains the same:**
```javascript
{
  id: 123,
  name: "John Doe",
  email: "john@example.com",
  mobile: "9876543210"
}
```

**Note:** `role` field removed for customers (not needed)

## 🚀 Migration Steps

### Step 1: Run Database Migration

```bash
cd backend
node migrations/separate_users_customers.js
```

This will:
- Create `customer_session` table
- Migrate non-admin users to `customer` table
- Remove `mobile` column from `users` table
- Add constraints and indexes

### Step 2: Update Backend Dependencies

No new dependencies required. Existing packages work with new structure.

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

### Step 4: Test Authentication

#### Test Customer Login:
```bash
# Send OTP
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# Verify OTP
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456", "name": "John Doe"}'
```

#### Test Admin Login:
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

### Step 5: Update Frontend (Already Done)

The Login component has been updated to:
- Support name field for new users
- Handle new response format
- Show better error messages
- Add resend OTP functionality

### Step 6: Clear User Sessions (Optional)

If you want to force all users to re-login:

```sql
-- Clear all sessions
DELETE FROM customer_session;
DELETE FROM admin_login;
```

## 📝 API Usage Examples

### Customer Authentication Flow

#### 1. Send OTP
```javascript
const response = await axios.post('/api/auth/send-otp', {
  mobile: '9876543210'
});

// Response:
{
  "statusCode": 200,
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "123456" // Only in development
  }
}
```

#### 2. Verify OTP
```javascript
const response = await axios.post('/api/auth/verify-otp', {
  mobile: '9876543210',
  otp: '123456',
  name: 'John Doe' // Optional, for new users
});

// Response:
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "isNewUser": false,
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210"
    },
    "token": "abc123...",
    "expiresAt": "2024-02-01T00:00:00Z"
  }
}
```

#### 3. Get Profile (Protected)
```javascript
const response = await axios.get('/api/auth/profile', {
  headers: {
    'Authorization': 'Bearer abc123...'
  }
});

// Response:
{
  "statusCode": 200,
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

#### 4. Update Profile (Protected)
```javascript
const response = await axios.put('/api/auth/profile', {
  name: 'John Smith',
  email: 'john.smith@example.com'
}, {
  headers: {
    'Authorization': 'Bearer abc123...'
  }
});

// Response:
{
  "statusCode": 200,
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 123,
    "name": "John Smith",
    "email": "john.smith@example.com",
    "mobile": "9876543210"
  }
}
```

#### 5. Logout (Protected)
```javascript
const response = await axios.post('/api/auth/logout', {}, {
  headers: {
    'Authorization': 'Bearer abc123...'
  }
});

// Response:
{
  "statusCode": 200,
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

## 🔒 Security Improvements

1. **Separate Session Tables**: Admin and customer sessions are now separate
2. **Token Expiry**: Customer sessions expire after 30 days
3. **Session Cleanup**: Old sessions are automatically cleaned up
4. **IP Tracking**: Customer sessions track IP address and user agent
5. **Account Status**: Customers can be deactivated without deleting data

## 🐛 Troubleshooting

### Issue: "Invalid or expired token"

**Solution:**
- Clear localStorage and login again
- Check if session expired (30 days for customers)
- Verify token is being sent in Authorization header

### Issue: "Mobile column does not exist"

**Solution:**
- Run the migration script: `node migrations/separate_users_customers.js`
- Check if migration completed successfully

### Issue: "Customer not found"

**Solution:**
- Verify customer exists in `customer` table
- Check if customer is active (`is_active = true`)
- Ensure mobile number format is correct

### Issue: Frontend shows old user data

**Solution:**
```javascript
// Clear localStorage
localStorage.removeItem('user');
localStorage.removeItem('authToken');

// Dispatch logout event
window.dispatchEvent(new Event('userLogout'));
```

## 📊 Database Schema

### users table (Admin only)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'limited_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### customer table
```sql
CREATE TABLE customer (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### customer_session table
```sql
CREATE TABLE customer_session (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customer(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

## ✅ Checklist

- [ ] Run database migration
- [ ] Test admin login
- [ ] Test customer OTP login
- [ ] Test customer profile endpoints
- [ ] Verify frontend login works
- [ ] Clear old sessions (optional)
- [ ] Update any custom queries
- [ ] Test on production (staging first!)

## 🎉 Benefits

1. **Clear Separation**: Admins and customers are completely separate
2. **Better Security**: Different authentication methods for different user types
3. **Scalability**: Easier to add features specific to customers or admins
4. **Maintainability**: Cleaner code with dedicated tables and middleware
5. **Flexibility**: Can easily add more customer-specific features

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the migration logs
3. Verify database schema matches expected structure
4. Test with curl commands to isolate frontend/backend issues

---

**Migration completed successfully! 🚀**
