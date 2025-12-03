/**
 * Customer Authentication Middleware
 * Verifies customer session tokens from customer_session table
 */

const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Verify customer authentication token
 */
const customerAuth = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('Authentication token required');
    }

    // Verify token in customer_session table
    const [session] = await sql`
      SELECT cs.*, c.id, c.name, c.email, c.mobile, c.is_active
      FROM customer_session cs
      JOIN customer c ON cs.customer_id = c.id
      WHERE cs.session_token = ${token}
      AND cs.expires_at > NOW()
    `;

    if (!session) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    if (!session.is_active) {
      throw ApiError.forbidden('Account is deactivated');
    }

    // Attach customer info to request
    req.user = {
      id: session.customer_id,
      name: session.name,
      email: session.email,
      mobile: session.mobile,
      type: 'customer'
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional customer auth - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and guest users
 */
const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      req.user = null;
      return next();
    }

    const [session] = await sql`
      SELECT cs.*, c.id, c.name, c.email, c.mobile, c.is_active
      FROM customer_session cs
      JOIN customer c ON cs.customer_id = c.id
      WHERE cs.session_token = ${token}
      AND cs.expires_at > NOW()
    `;

    if (session && session.is_active) {
      req.user = {
        id: session.customer_id,
        name: session.name,
        email: session.email,
        mobile: session.mobile,
        type: 'customer'
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  customerAuth,
  optionalCustomerAuth
};
