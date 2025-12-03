const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Admin auth
const { customerAuth } = require('../middleware/customerAuth'); // Customer auth
const flexibleAuth = require('../middleware/flexibleAuth'); // Both admin and customer auth
const {
  createOrder,
  getOrderById,
  getAllOrders,
  getCustomerOrders,
  updateOrderStatus,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

// Get all orders (for admin only - protected)
router.get('/', auth, getAllOrders);

// Create order (allow both admin and customer)
router.post('/', flexibleAuth, createOrder);

// Get order by ID (customer auth)
router.get('/:id', customerAuth, getOrderById);

// Update order (admin only - for full order updates)
router.put('/:id', auth, updateOrder);

// Update order status (customer auth - for cancel/replacement requests)
router.patch('/:id/status', customerAuth, updateOrderStatus);

// Get customer orders (customer auth)
router.get('/customer/:customerId', customerAuth, getCustomerOrders);

// Delete order (admin only)
router.delete('/:id', auth, deleteOrder);

module.exports = router;
