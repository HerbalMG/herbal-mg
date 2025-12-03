# 🔐 Authentication System - Quick Reference

## 🎯 Overview

Your authentication system now has **two separate flows**:

1. **Admin Authentication** - Username/Password (for admin & limited_admin)
2. **Customer Authentication** - OTP/Mobile (for regular customers)

## 🚀 Quick Start

### Run Migration First!

**⚠️ IMPORTANT:** Before using the new system, run the migration:

1. Open **Supabase SQL Editor**
2. Copy content from `backend/migrations/RUN_THIS_IN_SUPABASE.sql`
3. Paste and run in Supabase
4. Restart your backend server

See `MIGRATION_INSTRUCTIONS.md` for detailed steps.

## 📡 API Endpoints

### Customer Endpoints (OTP-based)

```javascript
// 1. Send OTP
POST /api/auth/send-otp
Body: { mobile: "9876543210" }

// 2. Verify OTP & Login
POST /api/auth/verify-otp
Body: { 
  mobile: "9876543210", 
  otp: "123456",
  name: "John Doe" // Optional, for new users
}

// 3. Get Profile (Protected)
GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }

// 4. Update Profile (Protected)
PUT /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Body: { name: "New Name", email: "new@email.com" }

// 5. Logout (Protected)
POST /api/auth/logout
Headers: { Authorization: "Bearer <token>" }
```

### Admin Endpoints (Password-based)

```javascript
// 1. Admin Login
POST /api/login
Body: { 
  username: "admin", 
  password: "password" 
}

// 2. Admin Logout
POST /api/logout
Headers: { Authorization: "Bearer <token>" }
```

## 🔧 Using in Your Code

### Backend - Protect Customer Routes

```javascript
const { customerAuth } = require('./middleware/customerAuth');

// Protect route for customers only
router.get('/my-orders', customerAuth, (req, res) => {
  const customerId = req.user.id;
  // req.user contains: { id, name, email, mobile, type: 'customer' }
});
```

### Backend - Protect Admin Routes

```javascript
const adminAuth = require('./middleware/adminAuth');

// Protect route for admins only
router.get('/admin/users', adminAuth, (req, res) => {
  const adminId = req.user.id;
  // req.user contains: { id, name, email, role, type: 'admin' }
});
```

### Frontend - Customer Login

```javascript
// Already implemented in Login.jsx
// Just use the component:
import Login from './pages/Login/Login';

// The component handles:
// - Mobile number input
// - OTP sending
// - OTP verification
// - Name input for new users
// - Token storage
```

### Frontend - Check Authentication

```javascript
// Get current user
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('authToken');

// Check if logged in
const isLoggedIn = !!user && !!token;

// Get user info
if (isLoggedIn) {
  console.log('User:', user.name);
  console.log('Mobile:', user.mobile);
}
```

### Frontend - Make Authenticated Requests

```javascript
import axios from 'axios';

// Get token
const token = localStorage.getItem('authToken');

// Make request
const response = await axios.get('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Frontend - Logout

```javascript
// Call logout endpoint
await axios.post('/api/auth/logout', {}, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});

// Clear local storage
localStorage.removeItem('user');
localStorage.removeItem('authToken');

// Dispatch event to update UI
window.dispatchEvent(new Event('userLogout'));

// Redirect to home
navigate('/');
```

## 📊 Database Tables

### users (Admin only)
- `id` - Primary key
- `name` - Admin name
- `email` - Admin email (unique)
- `password_hash` - Hashed password
- `role` - 'admin' or 'limited_admin'
- `is_active` - Account status

### customer (Regular users)
- `id` - Primary key
- `name` - Customer name
- `email` - Customer email (optional)
- `mobile` - Mobile number (unique, required)
- `is_active` - Account status
- `last_login` - Last login timestamp

### customer_session (Customer auth)
- `id` - Primary key
- `customer_id` - Reference to customer
- `session_token` - Auth token
- `expires_at` - Token expiry (30 days)
- `ip_address` - Login IP
- `user_agent` - Browser info

### admin_login (Admin auth)
- `id` - Primary key
- `user_id` - Reference to users
- `session_token` - Auth token
- `expires_at` - Token expiry (7 days)

## 🎨 Response Format

All endpoints now use standardized format:

### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## 🔍 Common Tasks

### Task: Add Customer Authentication to Route

```javascript
// Before
router.get('/orders', orderController.getOrders);

// After
const { customerAuth } = require('./middleware/customerAuth');
router.get('/orders', customerAuth, orderController.getOrders);
```

### Task: Get Current Customer in Controller

```javascript
const { customerAuth } = require('./middleware/customerAuth');
const catchAsync = require('./utils/catchAsync');

exports.getMyOrders = catchAsync(async (req, res) => {
  const customerId = req.user.id; // From customerAuth middleware
  
  const orders = await sql`
    SELECT * FROM orders 
    WHERE customer_id = ${customerId}
  `;
  
  ApiResponse.success(res, orders);
});
```

### Task: Check if User is Admin or Customer

```javascript
// In middleware/controller
if (req.user.type === 'admin') {
  // Admin user
} else if (req.user.type === 'customer') {
  // Customer user
}
```

## ⚠️ Important Notes

1. **Migration Required**: Run the SQL migration before using the new system
2. **Token Storage**: Frontend stores token in `localStorage.authToken`
3. **Session Expiry**: Customer sessions expire after 30 days, admin after 7 days
4. **Mobile Format**: Must be 10 digits starting with 6-9
5. **OTP Validity**: OTP expires after 5 minutes

## 📚 Documentation Files

- `MIGRATION_INSTRUCTIONS.md` - How to run the migration
- `AUTHENTICATION_MIGRATION.md` - Detailed migration guide
- `BACKEND_STRUCTURE.md` - Overall backend structure
- `QUICK_REFERENCE.md` - Code patterns and examples

## ✅ Checklist

Before going to production:

- [ ] Run migration in Supabase
- [ ] Test customer OTP login
- [ ] Test admin login (if applicable)
- [ ] Test protected routes
- [ ] Clear old sessions
- [ ] Update environment variables
- [ ] Test on staging environment
- [ ] Monitor logs for errors

---

**Need help? Check `MIGRATION_INSTRUCTIONS.md` for step-by-step guide! 🚀**
