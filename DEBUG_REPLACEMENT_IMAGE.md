# Debug Replacement Image Not Showing

## Issue
Replacement images are not visible in the admin order page even after customer uploads them.

---

## Debugging Steps

### Step 1: Check Database Column Exists

Run this SQL query:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order' AND column_name = 'replacement_image';
```

**Expected Result:**
```
column_name        | data_type
-------------------|-----------
replacement_image  | character varying
```

**If column doesn't exist:**
```sql
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);
```

---

### Step 2: Check if Order Has Replacement Image

Find an order with Replacement status:
```sql
SELECT id, status, replacement_image, notes
FROM "order"
WHERE status = 'Replacement'
LIMIT 5;
```

**Expected Result:**
- Should show orders with `replacement_image` URL
- If `replacement_image` is NULL, the image wasn't saved

**If no replacement orders exist, create test data:**
```sql
-- Get an order ID first
SELECT id FROM "order" LIMIT 1;

-- Update it with test replacement image
UPDATE "order" 
SET 
  replacement_image = 'https://via.placeholder.com/400x300.png?text=Test+Replacement',
  status = 'Replacement',
  notes = 'Test replacement request'
WHERE id = 'your-order-id-here'
RETURNING id, status, replacement_image;
```

---

### Step 3: Check Backend Response

Open browser DevTools (F12) → Network tab:

1. Go to admin orders page
2. Find the request to `/api/order`
3. Click on it
4. Check the Response tab

**Look for:**
```json
[
  {
    "id": "...",
    "status": "Replacement",
    "replacement_image": "https://...",  // ← Should be here
    ...
  }
]
```

**If `replacement_image` is missing from response:**
- Backend query might not be selecting it
- Check `getAllOrders` function

---

### Step 4: Check Frontend Console

Open browser Console (F12):

Look for these logs:
```
✅ Fetched orders: [...]
First order replacement_image: https://... or undefined
Orders with replacement images: 0 or more
```

**If replacement_image is undefined:**
- Backend is not returning the field
- Check Step 3

**If replacement_image has a value:**
- Frontend is receiving it correctly
- Check if column is visible

---

### Step 5: Check Column Visibility

In admin orders page:

1. Look for "Columns" dropdown button
2. Click it
3. Check if "Replacement Image" is checked
4. If unchecked, check it

**Or check in code:**
```javascript
visibleColumns: {
  replacementImage: true,  // ← Should be true
}
```

---

### Step 6: Test Customer Upload

1. **Login as customer**
2. **Go to Order History**
3. **Request replacement:**
   - Select issues
   - Enter reason
   - Upload image
   - Submit

4. **Check browser console for:**
   ```
   Uploading replacement image...
   Image uploaded successfully
   Replacement request submitted successfully
   ```

5. **Check Network tab:**
   - POST to `/api/upload` → Should return `imageUrl`
   - PATCH to `/api/order/:id/status` → Should include `replacement_image`

---

## Common Issues & Solutions

### Issue 1: Column doesn't exist in database

**Symptom:** SQL error when updating order

**Solution:**
```sql
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);
```

---

### Issue 2: Image uploads but doesn't save to order

**Symptom:** 
- Upload succeeds
- Order status changes
- But replacement_image is NULL in database

**Check:**
1. Frontend sends `replacement_image` in request body
2. Backend `updateOrderStatus` accepts `replacement_image`
3. SQL UPDATE includes `replacement_image` field

**Debug backend:**
```javascript
console.log('Request body:', req.body);
console.log('Replacement image:', replacement_image);
```

---

### Issue 3: Backend doesn't return replacement_image

**Symptom:** Field exists in DB but not in API response

**Check:**
- `getAllOrders` query uses `SELECT o.*` (includes all columns)
- No transformation removes the field

**Test query directly:**
```sql
SELECT id, replacement_image FROM "order" WHERE replacement_image IS NOT NULL;
```

---

### Issue 4: Frontend receives data but doesn't display

**Symptom:** Console shows replacement_image but column is empty

**Check:**
1. Column visibility: `visibleColumns.replacementImage = true`
2. Correct field name: `order.replacement_image` (not `order.replacementImage`)
3. Conditional rendering: `{order.replacement_image ? ... : ...}`

---

### Issue 5: Image URL is broken

**Symptom:** "View" link appears but image doesn't load

**Check:**
1. URL is valid (starts with https://)
2. Image exists on ImageKit
3. No CORS issues
4. Image is publicly accessible

**Test URL:**
- Copy URL from database
- Paste in browser
- Should load the image

---

## Quick Test Script

Run this in browser console on admin orders page:

```javascript
// Check if orders have replacement images
const orders = JSON.parse(localStorage.getItem('orders') || '[]');
console.log('Total orders:', orders.length);
console.log('Orders with replacement images:', 
  orders.filter(o => o.replacement_image).length
);

// Show replacement images
orders.forEach(order => {
  if (order.replacement_image) {
    console.log(`Order ${order.id}:`, order.replacement_image);
  }
});
```

---

## Manual Test Data

If you want to test without going through the customer flow:

```sql
-- Add test replacement image to first order
UPDATE "order" 
SET 
  replacement_image = 'https://via.placeholder.com/400x300.png?text=Replacement+Image',
  status = 'Replacement',
  notes = 'Manual test replacement'
WHERE id = (SELECT id FROM "order" LIMIT 1)
RETURNING id, status, replacement_image;
```

Then:
1. Refresh admin orders page
2. Should see "View" link in Replacement Image column
3. Click to open image

---

## Verification Checklist

- [ ] Database column exists
- [ ] Migration has been run
- [ ] Order has replacement_image value in database
- [ ] Backend returns replacement_image in API response
- [ ] Frontend receives replacement_image in console logs
- [ ] Column visibility is enabled
- [ ] "View" link appears in table
- [ ] Clicking link opens image
- [ ] Image displays in order details modal

---

## Expected Flow

1. ✅ Customer uploads image → ImageKit
2. ✅ Get image URL from upload response
3. ✅ Send PATCH request with replacement_image
4. ✅ Backend saves to database
5. ✅ Admin fetches orders
6. ✅ Backend returns replacement_image
7. ✅ Frontend displays "View" link
8. ✅ Click opens image in new tab

---

## Files to Check

1. **Database:** `order` table has `replacement_image` column
2. **Backend:** `orderController.js` - `updateOrderStatus` and `getAllOrders`
3. **Frontend Service:** `orderService.js` - `updateOrderStatus`
4. **Frontend Page:** `OrderHistory.jsx` - upload and submit logic
5. **Admin Panel:** `Orders.jsx` - display logic

---

## Next Steps

1. Run Step 1 to check if column exists
2. If not, run the migration
3. Run Step 2 to add test data
4. Refresh admin page
5. Check if "View" link appears
6. If still not working, check Steps 3-6

**The most common issue is that the migration hasn't been run yet!**
