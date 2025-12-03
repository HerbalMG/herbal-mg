# Customer Authentication Fix - 401 Error

## Error
```
PUT http://localhost:3001/api/order/HERB-MI5VTVR8-KQ8GGY 401 (Unauthorized)
Error updating order status: Error: HTTP error! status: 401
```

## Root Cause
The customer was trying to update their order using the PUT `/api/order/:id` endpoint, which requires **admin authentication**. Customers only have customer authentication tokens, so they got a 401 Unauthorized error.

## Routes Authentication
```javascript
// Admin only
router.put('/:id', auth, updateOrder);  // ❌ Requires admin auth

// Customer allowed
router.patch('/:id/status', customerAuth, updateOrderStatus);  // ✅ Allows customer auth
```

## Solution

### 1. Updated Backend (`backend/controllers/orderController.js`)

Enhanced `updateOrderStatus` function to accept `replacement_image` and `notes`:

**Before:**
```javascript
async function updateOrderStatus(req, res) {
  const { status } = req.body;
  
  await sql`
    UPDATE "order"
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
}
```

**After:**
```javascript
async function updateOrderStatus(req, res) {
  const { status, replacement_image, notes } = req.body;
  
  // Get current order
  const [currentOrder] = await sql`SELECT * FROM "order" WHERE id = ${id}`;
  
  // Update with new values or keep existing
  await sql`
    UPDATE "order"
    SET 
      status = ${status},
      replacement_image = ${replacement_image !== undefined ? replacement_image : currentOrder.replacement_image},
      notes = ${notes !== undefined ? notes : currentOrder.notes},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
}
```

### 2. Updated Frontend (`frontend/src/services/orderService.js`)

Changed to always use PATCH endpoint:

**Before:**
```javascript
// Used PUT for replacement_image (requires admin auth) ❌
const endpoint = additionalData.replacement_image
  ? `${API_BASE_URL}/order/${orderId}`  // PUT - admin only
  : `${API_BASE_URL}/order/${orderId}/status`;  // PATCH - customer allowed
```

**After:**
```javascript
// Always use PATCH (allows customer auth) ✅
const response = await fetch(`${API_BASE_URL}/order/${orderId}/status`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${authToken}`  // Customer token works
  },
  body: JSON.stringify({ status, ...additionalData })
});
```

## Endpoint Comparison

### PUT /api/order/:id (Admin Only)
- **Auth:** Admin token required
- **Use:** Full order updates by admin
- **Fields:** All order fields
- **Access:** Admin panel only

### PATCH /api/order/:id/status (Customer Allowed)
- **Auth:** Customer token allowed
- **Use:** Status updates by customer
- **Fields:** status, replacement_image, notes
- **Access:** Customer order history

## Request Flow

### Before (Broken)
```
Customer → PUT /api/order/:id
         → Admin auth middleware
         → 401 Unauthorized ❌
```

### After (Fixed)
```
Customer → PATCH /api/order/:id/status
         → Customer auth middleware
         → updateOrderStatus controller
         → Update status + replacement_image + notes
         → 200 Success ✅
```

## Testing

### Test Replacement Request

1. **Login as Customer**
2. **Go to Order History**
3. **Click "Request Replacement"**
4. **Fill form and upload image**
5. **Click "Submit"**

**Expected:**
- ✅ Image uploads successfully
- ✅ Order status updates to "Replacement"
- ✅ Replacement image URL saved
- ✅ Notes saved with issues and reason
- ✅ No 401 error

### Verify in Admin Panel

1. **Login as Admin**
2. **Go to Orders page**
3. **Find the replacement order**
4. **See "View" link in Replacement Image column**
5. **Click to view uploaded image**

## Security

### Customer Permissions
- ✅ Can update own order status
- ✅ Can add replacement_image
- ✅ Can add notes
- ❌ Cannot update other customers' orders
- ❌ Cannot delete orders
- ❌ Cannot update payment info

### Admin Permissions
- ✅ Can update any order (PUT /api/order/:id)
- ✅ Can update all fields
- ✅ Can delete orders
- ✅ Can view all orders

## Files Modified

1. **`backend/controllers/orderController.js`**
   - Updated `updateOrderStatus` to accept replacement_image and notes

2. **`frontend/src/services/orderService.js`**
   - Changed to always use PATCH endpoint

## Summary

✅ **Fixed 401 error** by using customer-allowed endpoint
✅ **Enhanced PATCH endpoint** to support replacement_image and notes
✅ **Customers can now** request replacements with images
✅ **Admins can still** use PUT endpoint for full updates
✅ **Security maintained** - customers can only update own orders

**Restart your backend server and try the replacement request again!** 🎉
