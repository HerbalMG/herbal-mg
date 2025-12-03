# Prescription Feature Documentation

## Overview
The prescription upload feature allows customers to upload prescription documents for prescription-required products. The prescription can be uploaded either on the product details page or during checkout.

---

## Features

### 1. Product Details Page
- Customers can upload prescriptions when adding prescription-required products to cart
- Prescription is uploaded to server immediately
- Prescription URL is stored with the cart item
- Supports image files (JPG, PNG, etc.) and PDF files
- File size limit: 3MB

### 2. Checkout Page
- Automatically detects if prescription was uploaded on product page
- Shows "Prescription already uploaded" message if prescription exists
- Allows uploading prescription during checkout if not uploaded earlier
- Allows replacing prescription if needed
- Validates that prescription is uploaded before allowing payment

### 3. Admin Panel
- View prescription files for each order
- Prescription column in orders table
- Click "View" to open prescription in new tab
- Shows "No file" if prescription not uploaded

---

## Database Schema

### Products Table
```sql
prescription_required BOOLEAN DEFAULT FALSE
```

### Orders Table
```sql
prescription_url VARCHAR(500) NULL
```

---

## User Flow

### Flow 1: Upload on Product Page
1. Customer views product with `prescription_required = true`
2. Uploads prescription file
3. Clicks "Add to Cart"
4. Prescription uploads to server
5. Product added to cart with prescription URL
6. Goes to checkout
7. Sees "Prescription already uploaded" message
8. Proceeds to payment

### Flow 2: Upload During Checkout
1. Customer adds prescription-required product to cart (without uploading)
2. Goes to checkout
3. Sees red warning: "Please upload prescription"
4. Uploads prescription on Step 3 (Delivery Options)
5. Proceeds to payment

---

## Validation Rules

1. **Product Page:** Cannot add prescription-required product to cart without uploading prescription
2. **Checkout:** Cannot proceed from Step 3 to Step 4 if prescription required but not uploaded
3. **Order Creation:** Prescription URL is included in order data

---

## API Endpoints

### Upload Prescription
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- image: File
- folderType: "prescription"

Response:
{
  "imageUrl": "https://..."
}
```

### Create Order
```
POST /api/order
Content-Type: application/json

Body:
{
  "customer_id": 1,
  "items": [...],
  "prescription_url": "https://...",
  ...
}
```

---

## File Storage

Prescriptions are stored using ImageKit (or configured file storage service):
- Folder: `prescription/`
- File naming: Handled by ImageKit
- Access: Public URLs for viewing

---

## Security Considerations

1. **File Type Validation:** Only images and PDFs accepted
2. **File Size Limit:** 3MB maximum
3. **Server-side Validation:** Backend validates file uploads
4. **Access Control:** Admin can view all prescriptions
5. **HTTPS:** All prescription URLs use HTTPS

---

## Configuration

### Environment Variables
```env
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_endpoint
```

### Database Setup
```sql
-- Ensure columns exist
ALTER TABLE product ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prescription_url VARCHAR(500) NULL;
```

---

## Testing

### Test Prescription-Required Product
```sql
-- Mark a product as requiring prescription
UPDATE product SET prescription_required = true WHERE id = 1;
```

### Test Flow
1. Add prescription-required product to cart with prescription
2. Go to checkout
3. Verify prescription is recognized
4. Complete order
5. Check admin panel for prescription link

---

## Troubleshooting

### Issue: Prescription not recognized in checkout
**Solution:** Check that prescription_url is stored in cart item (localStorage)

### Issue: Upload fails
**Solution:** Check ImageKit configuration and backend logs

### Issue: Validation not working
**Solution:** Verify product has `prescription_required = true` in database

---

## Future Enhancements

1. Multiple prescription uploads per order
2. Prescription expiry date tracking
3. OCR integration for prescription details
4. Pharmacist verification workflow
5. Prescription history in customer profile
6. Email notifications for prescription uploads

---

## Support

For issues or questions:
1. Check backend logs for upload errors
2. Verify database schema
3. Check ImageKit configuration
4. Review browser console for errors
