/**
 * Legacy error handlers - DEPRECATED
 * Use ApiError and the new error handling middleware instead
 * @deprecated
 */

const ApiError = require('./ApiError');

/**
 * @deprecated Use ApiError.conflict() instead
 */
function handleSlugConflictError(err, res, message) {
  if (err.message.includes('duplicate key value violates unique constraint') && err.message.includes('slug')) {
    return res.status(400).json({ error: message });
  }
  res.status(500).json({ error: err.message });
}

/**
 * Convert database errors to ApiError
 */
function handleDatabaseError(err) {
  // Unique constraint violation
  if (err.code === '23505') {
    if (err.message.includes('slug')) {
      return ApiError.conflict('A resource with this slug already exists');
    }
    return ApiError.conflict('Duplicate entry found');
  }

  // Foreign key violation
  if (err.code === '23503') {
    return ApiError.badRequest('Referenced resource does not exist');
  }

  // Invalid input syntax
  if (err.code === '22P02') {
    return ApiError.badRequest('Invalid input format');
  }

  // Not null violation
  if (err.code === '23502') {
    return ApiError.badRequest('Required field is missing');
  }

  return ApiError.internal('Database error occurred');
}

module.exports = { 
  handleSlugConflictError,
  handleDatabaseError
};
