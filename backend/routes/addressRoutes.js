const express = require('express');
const router = express.Router();
const sql = require('../config/supabase');
const { customerAuth } = require('../middleware/customerAuth');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

// Get all addresses for a customer
router.get('/customer/:customerId', customerAuth, catchAsync(async (req, res) => {
  // Verify customer can only access their own addresses
  if (parseInt(req.params.customerId) !== req.user.id) {
    throw ApiError.forbidden('You can only access your own addresses');
  }

  const addresses = await sql`
    SELECT * FROM address 
    WHERE customer_id = ${req.params.customerId}
    ORDER BY is_default DESC, created_at DESC
  `;
  
  ApiResponse.success(res, addresses, 'Addresses fetched successfully');
}));

// Create new address
router.post('/', customerAuth, catchAsync(async (req, res) => {
  const { customer_id, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  
  // Verify customer can only create addresses for themselves
  if (parseInt(customer_id) !== req.user.id) {
    throw ApiError.forbidden('You can only create addresses for yourself');
  }
  
  if (!address_line1 || !city || !state || !pincode) {
    throw ApiError.badRequest('Address line 1, city, state, and pincode are required');
  }
  
  // If this is set as default, unset other defaults for this customer
  if (is_default) {
    await sql`
      UPDATE address 
      SET is_default = false 
      WHERE customer_id = ${customer_id}
    `;
  }
  
  const [address] = await sql`
    INSERT INTO address (customer_id, address_line1, address_line2, city, state, pincode, country, is_default)
    VALUES (${customer_id}, ${address_line1}, ${address_line2 || null}, ${city}, ${state}, ${pincode}, ${country || 'India'}, ${is_default || false})
    RETURNING *
  `;
  
  ApiResponse.created(res, address, 'Address created successfully');
}));

// Update address
router.put('/:id', customerAuth, catchAsync(async (req, res) => {
  const { address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  
  // Verify customer owns this address
  const [currentAddress] = await sql`SELECT customer_id FROM address WHERE id = ${req.params.id}`;
  
  if (!currentAddress) {
    throw ApiError.notFound('Address not found');
  }
  
  if (currentAddress.customer_id !== req.user.id) {
    throw ApiError.forbidden('You can only update your own addresses');
  }
  
  // If this is set as default, unset other defaults for this customer
  if (is_default) {
    await sql`
      UPDATE address 
      SET is_default = false 
      WHERE customer_id = ${currentAddress.customer_id} AND id != ${req.params.id}
    `;
  }
  
  const [address] = await sql`
    UPDATE address 
    SET address_line1 = ${address_line1}, 
        address_line2 = ${address_line2 || null}, 
        city = ${city}, 
        state = ${state}, 
        pincode = ${pincode}, 
        country = ${country || 'India'}, 
        is_default = ${is_default || false},
        updated_at = NOW()
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  
  ApiResponse.success(res, address, 'Address updated successfully');
}));

// Delete address
router.delete('/:id', customerAuth, catchAsync(async (req, res) => {
  // Verify customer owns this address
  const [currentAddress] = await sql`SELECT customer_id FROM address WHERE id = ${req.params.id}`;
  
  if (!currentAddress) {
    throw ApiError.notFound('Address not found');
  }
  
  if (currentAddress.customer_id !== req.user.id) {
    throw ApiError.forbidden('You can only delete your own addresses');
  }
  
  await sql`DELETE FROM address WHERE id = ${req.params.id}`;
  
  ApiResponse.success(res, null, 'Address deleted successfully');
}));

module.exports = router;