# Order UUID Fix - Status Update Error

## Error
```
Error updating status: Error: Order not found
```

## Root Cause
The order table uses **UUID** for the `id` column, but the `updateOrder` function was using `parseInt(id)`, which:
1. Converts UUID string to NaN (Not a Number)
2. Query fails to find the order
3. Returns "Order not found" error

## Example
```javascript
// UUID value
id = "550e8400-e29b-41d4-a716-446655440000"

// parseInt(id) returns NaN
parseInt(id) // => NaN

// Query becomes:
SELECT * FROM "order" WHERE id = NaN  // ❌ Fails
```

## Solution
Removed `parseInt()` and use the UUID string directly:

**Before (Broken):**
```javascript
const [currentOrder] = await sql`SELECT * FROM "order" WHERE id = ${parseInt(id)}`;
// ...
WHERE id = ${parseInt(id)}
```

**After (Fixed):**
```javascript
const [currentOrder] = await sql`SELECT * FROM "order" WHERE id = ${id}`;
// ...
WHERE id = ${id}
```

## Files Modified
- `backend/controllers/orderController.js` - `updateOrder` function

## Testing
1. Restart backend server
2. Go to admin orders page
3. Change order status
4. Status should update successfully
5. Refresh page - status persists

## Note
- `customer_id` still uses `parseInt()` because it's an INTEGER type ✅
- `order.id` is UUID type, so no parsing needed ✅
- `deleteOrder` was already correct ✅

## Summary
✅ Fixed UUID handling in updateOrder function
✅ Order status updates now work correctly
✅ No more "Order not found" errors
