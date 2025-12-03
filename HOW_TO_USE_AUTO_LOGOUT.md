# How to Use Auto-Logout - Quick Guide

## ✅ Backend is Ready

Token expiration is now **36 hours** for both Admin and Customer logins.

## Frontend Implementation

### Step 1: Update Login Component

Find your login component (e.g., `frontend/src/pages/Login/Login.jsx`):

```javascript
import { authUtils } from '../../utils/auth';

// In your OTP verification success handler:
const handleOTPSuccess = (response) => {
  const { token, expiresAt, user } = response.data;
  
  // Save auth with expiry
  authUtils.saveAuth(token, expiresAt, user);
  
  // Redirect or update state
  navigate('/');
};
```

### Step 2: Add to App Component

In your main App component (e.g., `frontend/src/App.jsx`):

```javascript
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, user } = useAuth();
  
  // Auto-logout is now active!
  // Token expiration is checked automatically
  
  return (
    <Router>
      {/* Your routes */}
    </Router>
  );
}
```

### Step 3: Update Logout Button

```javascript
import { authUtils } from '../utils/auth';

function LogoutButton() {
  const handleLogout = () => {
    authUtils.logout(); // Clears everything and redirects
  };
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

## Admin Implementation

### Step 1: Update Admin Login

Find admin login (e.g., `admin/src/pages/Login.jsx`):

```javascript
import { authUtils } from '../utils/auth';

// In your login success handler:
const handleLoginSuccess = (response) => {
  const { token, expires_at, user } = response.data;
  
  // Save auth with expiry
  authUtils.saveAuth(token, expires_at, user);
  
  // Redirect
  navigate('/dashboard');
};
```

### Step 2: Add to Admin App

In admin App component (e.g., `admin/src/App.jsx`):

```javascript
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, user } = useAuth();
  
  // Auto-logout is now active!
  
  return (
    <Router>
      {/* Your routes */}
    </Router>
  );
}
```

## That's It!

Once you add these, auto-logout will work automatically:

✅ Token expires in 36 hours
✅ Auto-logout when expired
✅ Periodic checks every 5 minutes
✅ Console logs show expiration time

## Test It

1. **Login** to frontend or admin
2. **Check console**: 
   ```
   🔐 Token expires in 2160 minutes
   ```
3. **Wait** (or manually change `tokenExpiry` in localStorage to test)
4. **Auto-logout** triggers when expired

## Quick Test

To test immediately:

1. Login
2. Open DevTools (F12)
3. Go to Application → Local Storage
4. Find `tokenExpiry`
5. Change to a past date: `2020-01-01T00:00:00.000Z`
6. Wait 5 minutes (or refresh page)
7. Should auto-logout

---

**Files to Update:**
- Frontend Login component
- Frontend App component
- Admin Login component
- Admin App component

**Time to implement:** 10 minutes
