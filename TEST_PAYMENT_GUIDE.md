# Test Payment Gateway Guide

## Overview
A test payment gateway has been set up for development and testing purposes. This allows you to test the complete checkout flow without needing a real payment gateway like PhonePe.

## Features

### Test Payment Button
- **Location**: Checkout page (Step 4 - Payment)
- **Functionality**: Simulates payment processing without real transactions
- **Options**:
  - ✅ **Simulate Success**: Creates order and redirects to success page
  - ❌ **Simulate Failure**: Shows payment failure message
  - **Cancel**: Close the test payment modal

### How It Works

1. **Add items to cart** and proceed to checkout
2. **Fill in shipping address** (Step 2)
3. **Select delivery option** (Step 3)
4. **Choose payment method** (Step 4)
5. Click **"Test Payment"** button
6. A modal will appear with test payment options:
   - Click "Simulate Success" to complete the order
   - Click "Simulate Failure" to test error handling
7. On success, you'll be redirected to the Order Success page

## Order Success Page

After a successful test payment, you'll see:
- ✅ Order confirmation
- Order ID and Transaction ID
- Order status
- Next steps information
- Options to:
  - View order details
  - Continue shopping

## Backend API

### New Endpoints Created

#### Create Order
```
POST /api/order
Authorization: Bearer <token>

Body:
{
  "customer_id": 123,
  "total_amount": 500.00,
  "payment_status": "completed",
  "payment_method": "test_payment",
  "transaction_id": "TEST_123456",
  "shipping_address": {...},
  "delivery_option": "standard",
  "order_notes": "Optional notes",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 250.00
    }
  ]
}
```

#### Get Order by ID
```
GET /api/order/:id
```

#### Get Customer Orders
```
GET /api/order/customer/:customerId
Authorization: Bearer <token>
```

## Files Created/Modified

### New Files
1. `frontend/src/components/Payment/TestPaymentButton.jsx` - Test payment component
2. `frontend/src/pages/OrderSuccess.jsx` - Order success page
3. `backend/controllers/orderController.js` - Order management
4. `backend/routes/orderRoutes.js` - Order API routes

### Modified Files
1. `frontend/src/pages/Checkout.jsx` - Added test payment button
2. `backend/app.js` - Registered order routes

## Testing Scenarios

### Successful Payment Flow
1. **Login** to your account (required)
2. Add products to cart
3. Click "Proceed to Checkout"
4. Complete checkout steps (address, delivery)
5. Click "Test Payment"
6. Click "Simulate Success"
7. Verify order is created in database
8. Verify redirect to success page
9. Verify cart is cleared

### Failed Payment Flow
1. **Login** to your account (required)
2. Add products to cart
3. Complete checkout steps
4. Click "Test Payment"
5. Click "Simulate Failure"
6. Verify error message is shown
7. Verify user stays on checkout page
8. Verify cart is NOT cleared

### Login Required
- ⚠️ **Users must be logged in** to access checkout and place orders
- Guest checkout has been disabled for testing
- Attempting to checkout without login will redirect to login page

## Switching to Real Payment Gateway

When you're ready to use a real payment gateway:

1. Configure your PhonePe credentials in backend
2. The real "Pay with PhonePe" button is already available below the test button
3. Users can choose between test and real payment
4. For production, simply remove or hide the test payment button

## Notes

- Test payments create real orders in the database
- Transaction IDs are prefixed with "TEST_" for easy identification
- Payment status is set to "completed" for successful test payments
- Cart is automatically cleared after successful payment
- Guest users can also use test payments

## Security

⚠️ **Important**: Remove or disable the test payment button in production!

Add environment check:
```javascript
{process.env.NODE_ENV === 'development' && (
  <TestPaymentButton ... />
)}
```

## Order Visibility

### User Profile/Frontend
Test orders will appear in the **Order History** page (`/order-history` or `/orders`):
- Orders are fetched from `GET /api/order/customer/:customerId`
- Shows order ID, date, status, total amount
- Displays order items with product names and prices
- Allows order tracking and management
- **Login required** to view orders

### Admin Panel
Test orders will appear in the **Orders** page in the admin dashboard:
- Orders are fetched from `GET /api/order` (requires admin authentication)
- Shows all orders including guest orders
- Displays customer information (name, mobile, email)
- Shows order items with product details
- Allows order status management

### Database
All test orders are stored in the `order` table with:
- `customer_id`: Actual customer ID (required - no guest orders)
- `status`: 'Ordered' (default)
- `total_amount`: Order total
- `address`: Shipping address (JSON string)
- `notes`: Order notes
- Order items stored in `order_item` table
- Payment records in `payment` table (if transaction_id provided)

## Support

For issues or questions about the test payment system, check:
- Browser console for errors
- Backend logs for API errors
- Database for order creation
- Order History page for user orders
- Admin panel for all orders
