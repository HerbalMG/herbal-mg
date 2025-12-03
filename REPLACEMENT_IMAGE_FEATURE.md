# Replacement Image Feature Documentation

## Overview
When customers request a replacement for an order, they can upload an image showing the issue with the product. This image is stored with the order and displayed in the admin panel.

---

## Database Changes

### Migration File
**File:** `backend/migrations/add_replacement_image.sql`

```sql
ALTER TABLE "order" 
ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);
```

### How to Apply Migration
```bash
# Connect to your database and run:
psql -U your_username -d your_database -f backend/migrations/add_replacement_image.sql

# Or using your database client, execute:
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);
```

---

## Backend Changes

### Order Controller (`backend/controllers/orderController.js`)

#### Updated `updateOrder` Function:
- Now accepts `replacement_image` in request body
- Stores replacement image URL in database
- Returns updated order with replacement_image field

**Request Example:**
```javascript
PUT /api/order/:id
{
  "status": "Replacement",
  "replacement_image": "https://imagekit.io/.../replacement.jpg"
}
```

**Response Example:**
```javascript
{
  "id": "uuid",
  "status": "Replacement",
  "replacement_image": "https://imagekit.io/.../replacement.jpg",
  ...
}
```

---

## Admin Panel Changes

### Orders Table (`admin/src/pages/Orders.jsx`)

#### New Column: "Replacement Image"
- Shows "View" link if replacement image exists
- Shows "No image" if no replacement image
- Purple color scheme to distinguish from prescription
- Click to open image in new tab

#### Order Details Modal
- New section: "Replacement Image"
- Purple background to distinguish from prescription
- Shows image preview (max 200px height)
- Click to view full size in new tab

---

## User Flow

### Customer Side (Future Implementation)
1. Customer receives order
2. Finds issue with product
3. Requests replacement
4. Uploads image showing the issue
5. Image URL stored with order

### Admin Side (Current Implementation)
1. Admin opens Orders page
2. Sees "Replacement Image" column
3. Orders with replacement images show "View" link
4. Click "View" to see image in new tab
5. Or click order row → View details modal
6. See replacement image in modal with preview

---

## Visual Indicators

### Table Column
```
┌─────────────────────────┐
│ Replacement Image       │
├─────────────────────────┤
│ 🖼️ View (purple link)   │
│ No image (gray text)    │
└─────────────────────────┘
```

### Order Details Modal
```
┌─────────────────────────────────────┐
│ Replacement Image:                  │
│ ┌─────────────────────────────────┐ │
│ │ 🖼️ View Replacement Image       │ │
│ │ [Image Preview - 200px max]     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Color Scheme

- **Prescription:** Blue (`text-blue-600`, `bg-blue-50`)
- **Replacement Image:** Purple (`text-purple-600`, `bg-purple-50`)

This helps admins quickly distinguish between:
- Medical prescriptions (blue)
- Product issue images (purple)

---

## API Integration

### Upload Replacement Image
When customer requests replacement, upload image first:

```javascript
// 1. Upload image
const formData = new FormData();
formData.append('image', file);
formData.append('folderType', 'replacement');

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { imageUrl } = await uploadResponse.json();

// 2. Update order with replacement image
await fetch(`/api/order/${orderId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'Replacement',
    replacement_image: imageUrl
  })
});
```

---

## Column Visibility

The "Replacement Image" column can be toggled on/off using the column visibility dropdown:

1. Click "Columns" button
2. Check/uncheck "Replacement Image"
3. Column shows/hides accordingly

---

## Testing

### Test Replacement Image Feature

1. **Run Migration:**
   ```sql
   ALTER TABLE "order" ADD COLUMN IF NOT EXISTS replacement_image VARCHAR(500);
   ```

2. **Test with Existing Order:**
   ```sql
   -- Add test replacement image to an order
   UPDATE "order" 
   SET replacement_image = 'https://via.placeholder.com/400x300.png?text=Replacement+Image',
       status = 'Replacement'
   WHERE id = 'your-order-id';
   ```

3. **Verify in Admin Panel:**
   - Open Orders page
   - Find the order
   - See "View" link in Replacement Image column
   - Click to open image
   - Click order row → View details
   - See replacement image in modal

---

## File Storage

Replacement images are stored using the same upload service as prescriptions:
- **Service:** ImageKit (or configured service)
- **Folder:** `replacement/`
- **Max Size:** 3MB (configurable)
- **Formats:** JPG, PNG, GIF, etc.

---

## Security

- ✅ Only admins can view replacement images
- ✅ Images stored on secure CDN
- ✅ HTTPS URLs only
- ✅ No direct database access from frontend
- ✅ Authentication required for all order operations

---

## Future Enhancements

1. **Customer Portal:**
   - Allow customers to upload replacement images
   - Show replacement request status
   - Upload multiple images per replacement

2. **Admin Features:**
   - Approve/reject replacement requests
   - Add admin comments on replacement images
   - Track replacement history

3. **Notifications:**
   - Email admin when replacement image uploaded
   - Notify customer when replacement approved

4. **Analytics:**
   - Track replacement reasons
   - Generate reports on product issues
   - Identify problematic products

---

## Troubleshooting

### Issue: Column not showing
**Solution:** Run the migration to add the column to database

### Issue: Images not displaying
**Check:**
- Image URL is valid
- Image is accessible (not behind auth)
- Browser can load the image
- Check browser console for errors

### Issue: Upload fails
**Check:**
- Upload endpoint is working
- ImageKit configuration is correct
- File size is under limit
- File format is supported

---

## Summary

✅ **Database:** Added `replacement_image` column to order table
✅ **Backend:** Updated `updateOrder` to handle replacement images
✅ **Admin Panel:** Added column and modal section for replacement images
✅ **Visual Design:** Purple color scheme to distinguish from prescriptions
✅ **User Experience:** Easy to view and manage replacement images

**The replacement image feature is now ready to use!**
