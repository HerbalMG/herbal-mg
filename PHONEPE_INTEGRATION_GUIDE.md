# PhonePe Payment Gateway Integration Guide

## Overview
This guide explains the PhonePe payment gateway integration implemented for your e-commerce application.

## Backend Implementation

### 1. Configuration Files
- `backend/config/phonepe.js` - PhonePe configuration and utilities
- `backend/services/phonePeService.js` - PhonePe API service
- `backend/controllers/paymentController.js` - Payment controller with PhonePe methods
- `backend/routes/payment.js` - Payment routes including PhonePe endpoints

### 2. Database Schema
The payment table has been extended with PhonePe-specific fields:
- `merchant_transaction_id` - PhonePe transaction ID
- `transaction_id` - PhonePe gateway transaction ID  
- `response_code` - PhonePe response code

### 3. API Endpoints
- `POST /api/payments/phonepe/initiate` - Initiate payment
- `POST /api/payments/phonepe/callback` - Handle PhonePe callback
- `GET /api/payments/phonepe/status/:merchantTransactionId` - Check payment status

## Frontend Implementation

### 1. Components
- `PaymentButton.jsx` - Reusable payment button component
- `PaymentCallback.jsx` - Handle payment callback and status
- `CartTest.jsx` - Test component for cart functionality

### 2. Pages
- `Checkout.jsx` - Updated checkout page with PhonePe integration
- `TestPayment.jsx` - Test page for payment integration

### 3. Services
- `paymentService.js` - Frontend service for payment API calls

## Testing the Integration

### 1. Test Cart Functionality
1. Go to `/test-payment` route
2. Use the CartTest component to add test items
3. Verify items appear in cart

### 2. Test Payment Flow
1. Add items to cart using CartTest
2. Go to `/checkout` 
3. Fill in mobile number
4. Click "Pay with PhonePe"
5. Should redirect to PhonePe payment page

### 3. Database Testing
Run the migration test:
```bash
cd backend
node scripts/test-migration.js
```

### 4. API Testing
Test the payment API:
```bash
curl http://localhost:3001/api/payment-test
```

## Configuration

### Environment Variables (.env)
```
# PhonePe Configuration
PHONEPE_MERCHANT_ID=PGTESTPAYUAT
PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
PHONEPE_REDIRECT_URL=http://localhost:3000/payment/callback
PHONEPE_CALLBACK_URL=http://localhost:3001/api/payments/phonepe/callback
```

## Troubleshooting

### Common Issues

1. **"No items in cart" on checkout page**
   - Use the CartTest component to add test items
   - Check browser localStorage for 'cart' key
   - Verify CartContext is properly imported

2. **Payment initiation fails**
   - Check backend logs for errors
   - Verify PhonePe credentials in .env
   - Test database connection

3. **Database connection errors**
   - Run `node scripts/test-migration.js` to test DB
   - Check DATABASE_URL in .env
   - Ensure database is running

### Debug Steps

1. **Check Cart State**
   ```javascript
   // In browser console
   console.log(JSON.parse(localStorage.getItem('cart')));
   ```

2. **Test API Endpoints**
   ```bash
   # Test payment API
   curl http://localhost:3001/api/payment-test
   
   # Test database
   curl http://localhost:3001/api/postgres-test
   ```

3. **Check Network Requests**
   - Open browser DevTools
   - Go to Network tab
   - Try payment flow
   - Check for failed requests

## Production Deployment

### Before Going Live:
1. Update PhonePe credentials with production values
2. Update redirect URLs to production domains
3. Remove test components (CartTest, TestPayment)
4. Run database migrations on production
5. Test with real PhonePe merchant account

### Security Considerations:
- Never expose salt keys in frontend
- Validate all callback signatures
- Use HTTPS for all payment URLs
- Implement proper error handling
- Log payment transactions for audit

## Next Steps

1. **Remove Test Components**: Remove CartTest and TestPayment from production
2. **Add Order Management**: Link payments to order system
3. **Add Webhooks**: Implement PhonePe webhooks for better reliability
4. **Add Refunds**: Implement refund functionality
5. **Add Analytics**: Track payment success rates and failures