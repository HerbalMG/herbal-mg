const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/paymentController');

// Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }
  next();
}

// Admin Routes
router.get('/', auth, requireAdmin, controller.getAllPayments);
router.get('/:id', auth, requireAdmin, controller.getPaymentById);
router.post('/', auth, requireAdmin, controller.createPayment);
router.put('/:id', auth, requireAdmin, controller.updatePayment);
router.delete('/:id', auth, requireAdmin, controller.deletePayment);

// PhonePe Integration Routes
router.post('/phonepe/initiate', auth, controller.initiatePhonePePayment);
router.post('/phonepe/callback', controller.phonePeCallback); // No auth for callback
router.get('/phonepe/status/:merchantTransactionId', auth, controller.checkPaymentStatus);

module.exports = router;