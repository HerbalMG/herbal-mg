# Debugging Admin Orders Not Loading

## Quick Checklist

### 1. Check Browser Console
Open DevTools (F12) → Console tab and look for:

**Expected logs:**
```
Orders component mounted, starting to load orders...
Calling getOrders()...
Fetching orders from: http://localhost:3001/api/order
✅ Fetched orders: [...]
Fetching customers and payments...
Customers: X Payments: Y
✅ Enriched orders: [...]
```

**If you see errors:**
- `No authentication token found` → Admin not logged in
- `401 Unauthorized` → Token expired, login again
- `403 Forbidden` → User is not admin
- `404 Not Found` → Backend endpoint issue
- `500 Server Error` → Backend error

### 2. Check Backend Console
Look for these logs in your backend terminal:

```
Fetching all orders for admin
Found orders: X
Returning orders with items: X
```

**If you see errors:**
- Check if backend is running on port 3001
- Check database connection
- Check if orders table exists

### 3. Verify Authentication

**In Browser Console:**
```javascript
// Check if admin is logged in
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('Token:', user.token || localStorage.getItem('token'));
console.log('Role:', user.role);
```

**Expected:**
- User object exists
- Token exists and is not empty
- Role is 'admin' or 'limited_admin'

**If not:**
- Logout and login again
- Check if login is working

### 4. Test API Directly

**In Browser Console (while on admin page):**
```javascript
const user = JSON.parse(localStorage.getItem('user'));
const token = user.token || localStorage.getItem('token');

fetch('http://localhost:3001/api/order', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

**Expected Response:**
```javascript
Status: 200
Data: [{ id: 'ORD-...', customer_id: 1, ... }]
```

### 5. Check Database

**In your database client:**
```sql
-- Check if orders exist
SELECT * FROM "order" LIMIT 5;

-- Check if order_item table exists
SELECT * FROM order_item LIMIT 5;

-- Check if customer table exists
SELECT * FROM customer LIMIT 5;
```

### 6. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No console logs at all | Check if Orders page is loading, check React errors |
| "No authentication token" | Login as admin again |
| "401 Unauthorized" | Token expired, logout and login |
| "403 Forbidden" | User is not admin, check role in database |
| "404 Not Found" | Backend route not registered, check app.js |
| "500 Server Error" | Check backend console for error details |
| Empty array returned | No orders in database, create a test order |
| Loading forever | Check network tab for stuck requests |

### 7. Network Tab Check

Open DevTools → Network tab:
1. Refresh the page
2. Look for request to `/api/order`
3. Check:
   - Status code (should be 200)
   - Request headers (Authorization header present?)
   - Response body (orders data or error?)

### 8. Backend Health Check

**Test if backend is running:**
```bash
curl http://localhost:3001/api/postgres-test
```

Should return database connection status.

### 9. Create Test Order

If no orders exist, create one from frontend:
1. Login as customer
2. Add items to cart
3. Complete checkout
4. Use test payment
5. Check if order appears in admin

### 10. Reset and Retry

If all else fails:
1. Logout from admin
2. Clear localStorage: `localStorage.clear()`
3. Close browser
4. Restart backend
5. Login as admin again
6. Check orders page

## Still Not Working?

Check these files for errors:
- `admin/src/pages/Orders.jsx` - Orders page component
- `admin/src/lib/orderApi.js` - API functions
- `backend/routes/orderRoutes.js` - Backend routes
- `backend/controllers/orderController.js` - Backend logic
- `backend/middleware/adminAuth.js` - Authentication

Look for console errors in both browser and backend!
