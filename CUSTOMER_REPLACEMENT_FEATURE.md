# Customer Replacement Request Feature - Complete

## Overview
Customers can now request replacements for delivered orders and upload images showing the issue with the product. The replacement request with image is sent to the admin panel for review.

---

## Customer Flow

### 1. View Order History
- Customer goes to Order History page
- Sees list of all their orders
- Orders show status: Ordered, Shipped, Delivered, etc.

### 2. Request Replacement
- For delivered orders, customer sees "Request Replacement" button
- Clicks button to open replacement modal

### 3. Fill Replacement Form
**Required Fields:**
- **Issues:** Select one or more issues (checkboxes)
  - Damaged product
  - Wrong item received
  - Missing parts
  - Quality issues
  - Other
- **Reason:** Text description of the issue
- **Image:** Upload photo showing the problem (required)

### 4. Submit Request
- Customer clicks "Submit"
- Image uploads to server
- Order status changes to "Replacement"
- Replacement image URL saved with order
- Admin receives the request

---

## Technical Implementation

### Frontend Changes

#### 1. Order History Page (`frontend/src/pages/OrderHistory.jsx`)

**Updated `confirmAction` Function:**
```javascript
const confirmAction = async () => {
  // Validate replacement form
  if (modalAction === 'replacement') {
    if (!replacementIssues.length || !replacementReason || !replacementImage) {
      toast.error('Please fill in all fields and upload an image.');
      return;
    }
  }

  // Upload replacement image
  if (modalAction === 'replacement' && replacementImage) {
    const formData = new FormData();
    formData.append('image', replacementImage);
    formData.append('folderType', 'replacement');
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const { imageUrl } = await uploadResponse.json();
    
    // Update order with replacement image
    await updateOrderStatus(orderId, 'Replacement', {
      replacement_image: imageUrl,
      notes: `Replacement requested. Issues: ${issues}. Reason: ${reason}`
    });
  }
};
```

**Features:**
- ✅ Image upload with loading state
- ✅ Form validation
- ✅ Error handling
- ✅ Success notifications
- ✅ Automatic status update

#### 2. Order Service (`frontend/src/services/orderService.js`)

**Updated `updateOrderStatus` Function:**
```javascript
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  // Use PUT /order/:id for updates with replacement_image
  // Use PATCH /order/:id/status for simple status updates
  const endpoint = additionalData.replacement_image || additionalData.notes
    ? `/api/order/${orderId}`
    : `/api/order/${orderId}/status`;
  
  const method = additionalData.replacement_image || additionalData.notes 
    ? 'PUT' 
    : 'PATCH';
  
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ status, ...additionalData })
  });
  
  return await response.json();
};
```

**Smart Routing:**
- Simple status change → PATCH /order/:id/status
- Status + image/notes → PUT /order/:id

---

## Backend Support

### Endpoints Used

#### 1. Upload Image
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- image: File
- folderType: "replacement"

Response:
{
  "imageUrl": "https://imagekit.io/.../replacement.jpg"
}
```

#### 2. Update Order
```
PUT /api/order/:id
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "status": "Replacement",
  "replacement_image": "https://imagekit.io/.../replacement.jpg",
  "notes": "Replacement requested. Issues: Damaged product. Reason: Box was crushed"
}

Response:
{
  "id": "uuid",
  "status": "Replacement",
  "replacement_image": "https://...",
  "notes": "...",
  ...
}
```

---

## Admin Panel View

### Orders Table
- New column: "Replacement Image"
- Shows "View" link for orders with replacement images
- Purple color to distinguish from prescriptions

### Order Details Modal
- Shows replacement image section
- Image preview (200px max)
- Click to view full size
- Purple background styling

---

## User Experience

### Loading States
```
1. Customer fills form
2. Clicks "Submit"
3. Shows: "Uploading replacement image..."
4. Shows: "Image uploaded successfully"
5. Shows: "Replacement request submitted successfully"
6. Modal closes
7. Order status updates to "Replacement"
```

### Error Handling
```
❌ Missing fields → "Please fill in all fields and upload an image"
❌ Upload fails → "Failed to upload image. Please try again"
❌ Update fails → "Failed to update order. Please try again"
```

### Success Flow
```
✅ Image uploaded
✅ Order updated
✅ Status changed to "Replacement"
✅ Admin notified (via admin panel)
✅ Customer sees updated status
```

---

## Data Flow

```
Customer Side:
1. Select issues
2. Enter reason
3. Upload image
   ↓
4. Image → Upload API → ImageKit
   ↓
5. Get image URL
   ↓
6. Update order with:
   - status: "Replacement"
   - replacement_image: URL
   - notes: Issues + Reason
   ↓
Admin Side:
7. See "Replacement" status
8. See "View" link in Replacement Image column
9. Click to view image
10. Review and process replacement
```

---

## File Storage

**Location:** ImageKit (or configured service)
**Folder:** `replacement/`
**Max Size:** 3MB
**Formats:** JPG, PNG, GIF, etc.
**Access:** Public URLs (HTTPS)

---

## Security

- ✅ Customer authentication required
- ✅ Can only update own orders
- ✅ File type validation
- ✅ File size limits
- ✅ Secure image URLs (HTTPS)
- ✅ Admin-only access to view all replacements

---

## Testing

### Test Replacement Request

1. **Login as Customer:**
   - Go to Order History page
   - Find a delivered order

2. **Request Replacement:**
   - Click "Request Replacement"
   - Select issues (e.g., "Damaged product")
   - Enter reason: "Product arrived broken"
   - Upload image showing damage
   - Click "Submit"

3. **Verify:**
   - See success message
   - Order status changes to "Replacement"
   - Image uploads successfully

4. **Check Admin Panel:**
   - Login as admin
   - Go to Orders page
   - Find the order
   - See "View" link in Replacement Image column
   - Click to view image
   - See replacement details in order modal

---

## Database

**Order Table:**
```sql
replacement_image VARCHAR(500)  -- Stores image URL
notes TEXT                      -- Stores replacement reason
status VARCHAR(50)              -- Set to 'Replacement'
```

---

## Future Enhancements

1. **Multiple Images:**
   - Allow uploading multiple images per replacement
   - Show gallery in admin panel

2. **Replacement Tracking:**
   - Track replacement status (Requested → Approved → Shipped)
   - Show timeline to customer

3. **Admin Actions:**
   - Approve/reject replacement requests
   - Add admin comments
   - Request more information

4. **Notifications:**
   - Email customer when replacement approved
   - Email admin when replacement requested
   - SMS notifications

5. **Analytics:**
   - Track replacement reasons
   - Identify problematic products
   - Generate reports

---

## Summary

✅ **Customer Side:** Complete replacement request form with image upload
✅ **Image Upload:** Automatic upload to ImageKit
✅ **Order Update:** Status + image URL + notes saved
✅ **Admin View:** See replacement images in orders table and modal
✅ **Error Handling:** Comprehensive validation and error messages
✅ **User Experience:** Loading states, success messages, smooth flow

**The customer replacement request feature is now fully functional!** 🎉
