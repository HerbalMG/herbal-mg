const sql = require('../config/supabase');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

// In-memory OTP storage (replace with Redis in production)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
const sendOtp = catchAsync(async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    throw ApiError.badRequest('Please provide a valid 10-digit mobile number');
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store OTP
  otpStore.set(mobile, { otp, expiresAt });

  // Send SMS using 2Factor API
  const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;
  
  if (TWO_FACTOR_API_KEY && process.env.NODE_ENV === 'production') {
    try {
      const axios = require('axios');
      const smsUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/${otp}`;
      
      const smsResponse = await axios.get(smsUrl);
      
      if (smsResponse.data.Status !== 'Success') {
        console.error('SMS sending failed:', smsResponse.data);
      } else {
        console.log(`SMS sent successfully to ${mobile}`);
      }
    } catch (smsError) {
      console.error('SMS API error:', smsError.message);
    }
  } else {
    // Development mode - log OTP to console
    console.log(`\n🔐 OTP for ${mobile}: ${otp}\n`);
  }

  // For development, return OTP in response (remove in production)
  ApiResponse.success(res, {
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  }, 'OTP sent successfully');
});

// Verify OTP
const verifyOtp = catchAsync(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    throw ApiError.badRequest('Mobile number and OTP are required');
  }

  // Check if OTP exists
  const storedData = otpStore.get(mobile);
  if (!storedData) {
    throw ApiError.badRequest('OTP not found or expired');
  }

  // Check if OTP is expired
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(mobile);
    throw ApiError.badRequest('OTP has expired');
  }

  // Verify OTP
  if (storedData.otp !== otp) {
    throw ApiError.badRequest('Invalid OTP');
  }

  // OTP is valid, remove it
  otpStore.delete(mobile);

  // Check if customer exists in customer table
  const [existingCustomer] = await sql`
    SELECT id, name, email, mobile, is_active
    FROM customer 
    WHERE mobile = ${mobile}
  `;

  let customer;
  let isNewUser = false;

  if (!existingCustomer) {
    // Create new customer with default name 'User'
    const [newCustomer] = await sql`
      INSERT INTO customer (name, mobile, is_active, created_at, updated_at)
      VALUES ('User', ${mobile}, true, NOW(), NOW())
      RETURNING id, name, email, mobile, is_active
    `;
    customer = newCustomer;
    isNewUser = true;
  } else {
    // Check if customer is active
    if (!existingCustomer.is_active) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }
    
    customer = existingCustomer;
    
    // Update last login only
    await sql`
      UPDATE customer 
      SET last_login = NOW(), updated_at = NOW()
      WHERE id = ${customer.id}
    `;
  }

  // Create session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours

  // Delete old sessions for this customer (optional cleanup)
  await sql`
    DELETE FROM customer_session 
    WHERE customer_id = ${customer.id}
  `;

  // Store new session
  await sql`
    INSERT INTO customer_session (
      customer_id, 
      session_token, 
      expires_at,
      ip_address,
      user_agent,
      created_at
    )
    VALUES (
      ${customer.id}, 
      ${sessionToken}, 
      ${expiresAt},
      ${req.ip || req.connection.remoteAddress},
      ${req.headers['user-agent'] || 'Unknown'},
      NOW()
    )
  `;

  ApiResponse.success(res, {
    isNewUser,
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile
    },
    token: sessionToken,
    expiresAt
  }, 'Login successful');
});

// Get current customer profile
const getProfile = catchAsync(async (req, res) => {
  const customerId = req.user.id;

  const [customer] = await sql`
    SELECT id, name, email, mobile, created_at, last_login
    FROM customer 
    WHERE id = ${customerId} AND is_active = true
  `;

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  ApiResponse.success(res, customer, 'Profile fetched successfully');
});

// Update customer profile
const updateProfile = catchAsync(async (req, res) => {
  const customerId = req.user.id;
  const { name, email } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  updates.updated_at = new Date();

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No fields to update');
  }

  const [customer] = await sql`
    UPDATE customer 
    SET ${sql(updates, ...Object.keys(updates))}
    WHERE id = ${customerId} AND is_active = true
    RETURNING id, name, email, mobile
  `;

  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }

  ApiResponse.success(res, customer, 'Profile updated successfully');
});

// Logout
const logout = catchAsync(async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    throw ApiError.badRequest('No token provided');
  }

  await sql`DELETE FROM customer_session WHERE session_token = ${token}`;

  ApiResponse.success(res, null, 'Logged out successfully');
});

module.exports = {
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  logout
};
