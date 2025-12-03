const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

exports.getAddressesForCustomer = catchAsync(async (req, res) => {
  const addresses = await sql`
    SELECT * FROM address 
    WHERE customer_id = ${req.params.customerId}
    ORDER BY is_default DESC, created_at DESC
  `;
  ApiResponse.success(res, addresses, 'Addresses fetched successfully');
});

exports.getAddressById = catchAsync(async (req, res) => {
  const [address] = await sql`
    SELECT * FROM address 
    WHERE id = ${req.params.addressId} AND customer_id = ${req.params.customerId}
  `;
  if (!address) {
    throw ApiError.notFound('Address not found');
  }
  ApiResponse.success(res, address, 'Address fetched successfully');
});

exports.addAddress = catchAsync(async (req, res) => {
  const { full_name, email, contact, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  
  if (!address_line1 || !city || !state || !pincode) {
    throw ApiError.badRequest('Address line 1, city, state, and pincode are required');
  }
  
  // Create address table if it doesn't exist (with new fields)
  await sql`
    CREATE TABLE IF NOT EXISTS address (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customer(id) ON DELETE CASCADE,
      full_name VARCHAR(255),
      email VARCHAR(255),
      contact VARCHAR(20),
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      country VARCHAR(100) DEFAULT 'India',
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  
  // If this is set as default, unset other defaults for this customer
  if (is_default) {
    await sql`
      UPDATE address 
      SET is_default = false 
      WHERE customer_id = ${req.params.customerId}
    `;
  }
  
  const [address] = await sql`
    INSERT INTO address (customer_id, full_name, email, contact, address_line1, address_line2, city, state, pincode, country, is_default)
    VALUES (${req.params.customerId}, ${full_name || null}, ${email || null}, ${contact || null}, ${address_line1}, ${address_line2 || null}, ${city}, ${state}, ${pincode}, ${country || 'India'}, ${is_default || false})
    RETURNING *
  `;
  
  ApiResponse.created(res, address, 'Address created successfully');
});

exports.updateAddress = catchAsync(async (req, res) => {
  const { full_name, email, contact, address_line1, address_line2, city, state, pincode, country, is_default } = req.body;
  
  // If this is set as default, unset other defaults for this customer
  if (is_default) {
    await sql`
      UPDATE address 
      SET is_default = false 
      WHERE customer_id = ${req.params.customerId} AND id != ${req.params.addressId}
    `;
  }
  
  const [address] = await sql`
    UPDATE address 
    SET full_name = ${full_name || null},
        email = ${email || null},
        contact = ${contact || null},
        address_line1 = ${address_line1}, 
        address_line2 = ${address_line2 || null}, 
        city = ${city}, 
        state = ${state}, 
        pincode = ${pincode}, 
        country = ${country || 'India'}, 
        is_default = ${is_default || false},
        updated_at = NOW()
    WHERE id = ${req.params.addressId} AND customer_id = ${req.params.customerId}
    RETURNING *
  `;
  
  if (!address) {
    throw ApiError.notFound('Address not found');
  }
  
  ApiResponse.success(res, address, 'Address updated successfully');
});

exports.deleteAddress = catchAsync(async (req, res) => {
  const [deleted] = await sql`
    DELETE FROM address 
    WHERE id = ${req.params.addressId} AND customer_id = ${req.params.customerId}
    RETURNING *
  `;
  
  if (!deleted) {
    throw ApiError.notFound('Address not found');
  }
  
  ApiResponse.success(res, null, 'Address deleted successfully');
});

exports.setDefaultAddress = catchAsync(async (req, res) => {
  // Unset all defaults for this customer
  await sql`
    UPDATE address 
    SET is_default = false 
    WHERE customer_id = ${req.params.customerId}
  `;
  
  // Set the specified address as default
  const [address] = await sql`
    UPDATE address 
    SET is_default = true, updated_at = NOW()
    WHERE id = ${req.params.addressId} AND customer_id = ${req.params.customerId}
    RETURNING *
  `;
  
  if (!address) {
    throw ApiError.notFound('Address not found');
  }
  
  ApiResponse.success(res, address, 'Default address set successfully');
});