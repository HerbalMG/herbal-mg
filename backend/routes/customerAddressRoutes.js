const express = require('express');
const router = express.Router();

const { customerAuth } = require('../middleware/customerAuth');
const flexibleAuth = require('../middleware/flexibleAuth');
const addressController = require('../controllers/addressController');

// Ensure the logged-in customer can only modify their own addresses
// Admin can access any customer's addresses
const ensureCustomerOwnership = (req, res, next) => {
  const requestedCustomerId = Number(req.params.customerId);

  // Allow if user is admin
  if (req.user && req.user.type === 'admin') {
    return next();
  }

  // For customers, ensure they can only access their own addresses
  if (!req.user || req.user.id !== requestedCustomerId) {
    return res.status(403).json({ error: 'Forbidden: cannot access addresses for another customer' });
  }

  next();
};

router.use(flexibleAuth);

router.get('/:customerId/addresses', ensureCustomerOwnership, addressController.getAddressesForCustomer);
router.get('/:customerId/addresses/:addressId', ensureCustomerOwnership, addressController.getAddressById);
router.post('/:customerId/addresses', ensureCustomerOwnership, addressController.addAddress);
router.put('/:customerId/addresses/:addressId', ensureCustomerOwnership, addressController.updateAddress);
router.delete('/:customerId/addresses/:addressId', ensureCustomerOwnership, addressController.deleteAddress);
router.post('/:customerId/addresses/:addressId/set-default', ensureCustomerOwnership, addressController.setDefaultAddress);

module.exports = router;
