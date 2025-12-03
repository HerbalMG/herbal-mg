/**
 * Admin Authentication Middleware
 * Verifies admin session tokens from admin_login table
 * Only for admin and limited_admin users
 */

const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw ApiError.unauthorized('Authentication token required');
    }
    
    // Check if token exists and is valid in admin_login table
    const [session] = await sql`
      SELECT al.*, u.id, u.name, u.email, u.role 
      FROM admin_login al 
      JOIN users u ON al.user_id = u.id 
      WHERE al.session_token = ${token} 
      AND al.expires_at > NOW()
      AND u.role IN ('admin', 'limited_admin')
    `;
    
    if (!session) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
    
    // Attach admin user info to request
    req.user = {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role,
      type: 'admin'
    };
    
    next();
  } catch (error) {
    next(error);
  }
};
