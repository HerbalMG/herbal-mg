# Order Status Standards

## Standardized Order Statuses

All parts of the application (Backend, Frontend, Admin) use these exact statuses:

1. **Ordered** - Initial status when order is placed
2. **Shipped** - Order has been shipped
3. **Delivered** - Order delivered to customer
4. **Replacement** - Replacement requested/approved
5. **Refunded** - Order refunded
6. **Cancelled** - Order cancelled

## Status Flow

```
Ordered → Shipped → Delivered
   ↓         ↓          ↓
Cancelled  Cancelled  Replacement → Refunded
```

## Implementation

### Backend
- Validation in `orderController.js`
- Database column: `status VARCHAR(50)`

### Frontend
- Order history display
- Status badges with colors

### Admin
- Status dropdown options
- Order management

## Color Coding

| Status | Color | Badge |
|--------|-------|-------|
| Ordered | Yellow | bg-yellow-100 text-yellow-700 |
| Shipped | Blue | bg-blue-100 text-blue-700 |
| Delivered | Green | bg-green-100 text-green-700 |
| Replacement | Purple | bg-purple-100 text-purple-700 |
| Refunded | Orange | bg-orange-100 text-orange-700 |
| Cancelled | Red | bg-red-100 text-red-700 |
