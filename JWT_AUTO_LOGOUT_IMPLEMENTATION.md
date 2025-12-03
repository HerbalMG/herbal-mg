# JWT Auto-Logout Implementation - 36 Hours ✅

## Overview

Implemented JWT token expiration and auto-logout after **36 hours** for both Admin Panel and Frontend (Customer).

## Changes Made

### 1. Backend Changes ✅

#### Updated Token Expiration Times

**File: `backend/utils/jwt.js`**
- Changed from `7d` to `36h`
- Added `verifyToken()` and `decodeToken()` methods

**File: `backend/controllers/authController.js`** (Admin Login)
- Changed from 7 days to 36 hours
- Returns `expires_at` in ISO format

**File: `backend/controllers/otpAuthController.js`** (Customer Login)
- Changed from 30 days to 36 hours
- Returns `expiresAt` in response

### 2. Frontend Changes ✅

#### Created Auth Utilities

**File: `frontend/src/utils/auth.js`**
- `saveAuth()` - Save token and expiry
- `getToken()` - Get stored token
- `isTokenExpired()` - Check if expired
- `getTimeUntilExpiry()` - Time remaining
- `isAuthenticated()` - Check auth status
- `logout()` - Clear auth and redirect
- `setupAutoLogout()` - Auto-logout timer
- `startExpirationCheck()` - Periodic check

**File: `frontend/src/hooks/useAuth.js`**
- React hook for auth management
- Auto-logout when token expires
- Periodic expiration checks (every 5 minutes)

### 3. Admin Changes ✅

**File: `admin/src/utils/auth.js`**
- Same utilities as frontend
- Admin-specific logging

**File: `admin/src/hooks/useAuth.js`**
- React hook for admin auth
- Auto-logout functionality

## How It Works

### Token Lifecycle

```
Login
  ↓
Token Created (expires in 36 hours)
  ↓
Token Stored in localStorage
  ↓
Auto-logout timer set
  ↓
Periodic checks every 5 minutes
  ↓
Token Expires → Auto Logout
```

### Auto-Logout Mechanism

1. **On Login**: Token expiry time is saved
2. **Timer Set**: Countdown to expiration
3. **Periodic Checks**: Every 5 minutes
4. **On Expiry**: Automatic logout and redirect

## Usage

### Frontend (Customer)

#### In Login Component

```javascript
import { useAuth } from '../hooks/useAuth';

function Login() {
  const { login } = useAuth();

  const handleLogin = async (mobile, otp) => {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp })
    });
    
    const data = await response.json();
    
    // Save auth with expiry
    login(data.token, data.expiresAt, data.user);
  };
}
```

#### In App Component

```javascript
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, user } = useAuth();
  
  // Auto-logout is handled automatically
  // Token expiration is checked every 5 minutes
  
  return (
    <div>
      {isAuthenticated ? (
        <Dashboard user={user} />
      ) : (
        <Login />
      )}
    </div>
  );
}
```

### Admin Panel

#### In Login Component

```javascript
import { useAuth } from '../hooks/useAuth';

function AdminLogin() {
  const { login } = useAuth();

  const handleLogin = async (username, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    // Save auth with expiry
    login(data.token, data.expires_at, data.user);
  };
}
```

## Console Logs

### On Login
```
🔐 Token expires in 2160 minutes
```

### Periodic Checks
```
🔐 Checking token expiration...
```

### On Expiry
```
🔐 Token expired - logging out
```

## API Response Format

### Admin Login Response
```json
{
  "token": "abc123...",
  "expires_at": "2025-11-22T17:30:00.000Z",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Customer Login Response
```json
{
  "token": "xyz789...",
  "expiresAt": "2025-11-22T17:30:00.000Z",
  "user": {
    "id": 123,
    "name": "John Doe",
    "mobile": "1234567890",
    "email": "john@example.com"
  }
}
```

## Token Storage

### localStorage Keys

- `token` - JWT token string
- `tokenExpiry` - ISO date string of expiration
- `user` - JSON string of user data

## Features

### ✅ Auto-Logout Timer
- Set on login
- Triggers exactly when token expires
- Cleans up on component unmount

### ✅ Periodic Expiration Check
- Runs every 5 minutes
- Catches edge cases
- Handles clock changes

### ✅ Manual Logout
- Clears all auth data
- Redirects to login
- Can be called anytime

### ✅ Token Validation
- Checks expiry before API calls
- Auto-logout if expired
- Prevents invalid requests

## Testing

### Test Auto-Logout

1. **Login** to admin or frontend
2. **Check console**: Should see "Token expires in X minutes"
3. **Wait** (or change system time)
4. **After 36 hours**: Auto-logout should trigger

### Test Periodic Check

1. **Login** to admin or frontend
2. **Open console**
3. **Wait 5 minutes**: Check runs automatically
4. **Manually expire token**: Change localStorage `tokenExpiry` to past date
5. **Wait 5 minutes**: Should auto-logout

### Test Manual Logout

1. **Login** to admin or frontend
2. **Click logout button**
3. **Check**: Should redirect to login
4. **Check localStorage**: Should be cleared

## Configuration

### Change Expiration Time

**Backend:**
```javascript
// backend/utils/jwt.js
const JWT_EXPIRES = "36h"; // Change this

// backend/controllers/authController.js
const expires_at = new Date(Date.now() + 36 * 60 * 60 * 1000); // Change this

// backend/controllers/otpAuthController.js
const expiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000); // Change this
```

### Change Check Interval

**Frontend/Admin:**
```javascript
// In useAuth hook
const cleanupExpirationCheck = authUtils.startExpirationCheck(5); // Change 5 to desired minutes
```

## Security Benefits

1. ✅ **Limited Token Lifetime** - 36 hours max
2. ✅ **Auto-Logout** - No manual intervention needed
3. ✅ **Periodic Validation** - Catches expired tokens
4. ✅ **Clean Logout** - Removes all auth data
5. ✅ **Server-Side Validation** - Backend checks expiry too

## Files Created/Modified

### Backend
1. ✅ `backend/utils/jwt.js` - Updated expiration
2. ✅ `backend/controllers/authController.js` - 36 hours
3. ✅ `backend/controllers/otpAuthController.js` - 36 hours

### Frontend
1. ✅ `frontend/src/utils/auth.js` - Auth utilities
2. ✅ `frontend/src/hooks/useAuth.js` - Auth hook

### Admin
1. ✅ `admin/src/utils/auth.js` - Auth utilities
2. ✅ `admin/src/hooks/useAuth.js` - Auth hook

## Migration Guide

### For Existing Login Components

**Before:**
```javascript
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

**After:**
```javascript
import { authUtils } from '../utils/auth';

authUtils.saveAuth(data.token, data.expires_at, data.user);
```

### For Existing App Components

**Before:**
```javascript
const token = localStorage.getItem('token');
```

**After:**
```javascript
import { useAuth } from '../hooks/useAuth';

function App() {
  const { isAuthenticated, user, getToken } = useAuth();
  // Auto-logout handled automatically
}
```

## Troubleshooting

### Token Expires Too Soon

Check backend expiration settings:
```bash
# Should be 36 hours
grep -r "36.*60.*60.*1000" backend/
```

### Auto-Logout Not Working

1. Check console for logs
2. Verify `tokenExpiry` in localStorage
3. Check if `useAuth` hook is used in App component

### Token Still Valid After 36 Hours

1. Check server time vs client time
2. Verify backend is using updated code
3. Check database `expires_at` column

## Summary

✅ **Backend**: Token expires in 36 hours
✅ **Frontend**: Auto-logout when expired
✅ **Admin**: Auto-logout when expired
✅ **Periodic Checks**: Every 5 minutes
✅ **Manual Logout**: Available anytime
✅ **Console Logging**: Shows expiration time

---

**Status**: ✅ Complete and ready to use
**Expiration**: 36 hours
**Auto-Logout**: Enabled
**Periodic Check**: Every 5 minutes
