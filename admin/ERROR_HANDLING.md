# Admin Panel Error Handling

## Overview
Improved error handling across the admin panel with centralized error management, user-friendly messages, and better debugging.

## Features

### 1. Centralized Error Handler (`admin/src/utils/errorHandler.js`)

**Functions:**
- `handleApiError(error, context)` - Handles API errors with user-friendly toast messages
- `withErrorHandling(fn, context)` - Wraps async functions with automatic error handling
- `checkAuth()` - Validates user authentication
- `checkAdminRole()` - Validates admin privileges
- `safeJsonParse(str, fallback)` - Safe JSON parsing with fallback
- `validateRequired(data, fields)` - Validates required fields

### 2. HTTP Status Code Handling

| Status | Message | Action |
|--------|---------|--------|
| 400 | Invalid request | Show error message |
| 401 | Session expired | Redirect to login after 2s |
| 403 | Access denied | Show permission error |
| 404 | Resource not found | Show not found message |
| 409 | Conflict | Show conflict message |
| 500 | Server error | Show server error |
| Network | Connection error | Show network error |

### 3. Improved API Functions

All API functions in `admin/src/lib/orderApi.js` now:
- ✅ Validate authentication token
- ✅ Handle responses consistently
- ✅ Show user-friendly error messages
- ✅ Log errors for debugging
- ✅ Throw errors for component handling

### 4. Usage Examples

**Basic API Call:**
```javascript
import { getOrders } from '../lib/orderApi';

try {
  const orders = await getOrders();
  // Handle success
} catch (error) {
  // Error already handled and toast shown
  // Just handle UI state
}
```

**With Custom Error Handling:**
```javascript
import { withErrorHandling } from '../utils/errorHandler';

const fetchData = withErrorHandling(async () => {
  const data = await someApiCall();
  return data;
}, 'fetchData');
```

**Validate Required Fields:**
```javascript
import { validateRequired } from '../utils/errorHandler';

const data = { name: 'Product', price: 100 };
if (!validateRequired(data, ['name', 'price', 'category'])) {
  return; // Error toast already shown
}
```

**Check Authentication:**
```javascript
import { checkAuth, checkAdminRole } from '../utils/errorHandler';

if (!checkAuth() || !checkAdminRole()) {
  return; // User redirected or error shown
}
```

## Error Messages

### User-Friendly Messages:
- ❌ Before: "HTTP error! status: 401"
- ✅ After: "Session expired. Please login again."

- ❌ Before: "Failed to fetch"
- ✅ After: "Network error. Please check your connection."

- ❌ Before: "Error: undefined"
- ✅ After: "An unexpected error occurred."

## Debugging

### Console Logs:
All errors are logged with context:
```
Error in getOrders: Error: Session expired
```

### Network Tab:
Check browser DevTools > Network tab for:
- Request headers (Authorization token)
- Response status codes
- Response body (error details)

### Backend Logs:
Check backend console for:
- API endpoint calls
- Database queries
- Error stack traces

## Best Practices

1. **Always use try-catch** in async functions
2. **Let handleApiError** show toast messages
3. **Log errors** for debugging
4. **Validate input** before API calls
5. **Check auth** before protected operations

## Migration Guide

### Old Code:
```javascript
try {
  const response = await fetch('/api/orders');
  if (!response.ok) {
    throw new Error('Failed');
  }
  return await response.json();
} catch (error) {
  console.error(error);
  alert('Error!');
}
```

### New Code:
```javascript
import { getOrders } from '../lib/orderApi';

try {
  const orders = await getOrders();
  return orders;
} catch (error) {
  // Error already handled
}
```

## Testing

Test error scenarios:
1. **401 Error**: Use expired token
2. **403 Error**: Use non-admin user
3. **404 Error**: Request non-existent resource
4. **500 Error**: Trigger server error
5. **Network Error**: Disconnect internet

All should show appropriate toast messages!
