/**
 * Flexible Authentication Middleware
 * Accepts both admin and customer tokens
 * Useful for endpoints that should work for both user types
 */

const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');

const flexibleAuth = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('Authentication token required');
    }

    // Try admin authentication first
    const [adminSession] = await sql`
      SELECT al.*, u.id, u.name, u.email, u.role 
      FROM admin_login al 
      JOIN users u ON al.user_id = u.id 
      WHERE al.session_token = ${token} 
      AND al.expires_at > NOW()
      AND u.role IN ('admin', 'limited_admin')
    `;

    if (adminSession) {
      // Admin authenticated
      req.user = {
        id: adminSession.user_id,
        name: adminSession.name,
        email: adminSession.email,
        role: adminSession.role,
        type: 'admin'
      };
      return next();
    }

    // Try customer authentication
    const [customerSession] = await sql`
      SELECT cs.*, c.id, c.name, c.email, c.mobile, c.is_active
      FROM customer_session cs
      JOIN customer c ON cs.customer_id = c.id
      WHERE cs.session_token = ${token}
      AND cs.expires_at > NOW()
    `;

    if (customerSession) {
      if (!customerSession.is_active) {
        throw ApiError.forbidden('Account is deactivated');
      }

      // Customer authenticated
      req.user = {
        id: customerSession.customer_id,
        name: customerSession.name,
        email: customerSession.email,
        mobile: customerSession.mobile,
        type: 'customer'
      };
      return next();
    }

    // Neither admin nor customer token found
    throw ApiError.unauthorized('Invalid or expired token');
  } catch (error) {
    next(error);
  }
};

module.exports = flexibleAuth;
