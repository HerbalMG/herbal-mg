const ApiError = require('../utils/ApiError');

/**
 * Convert errors to ApiError instances
 */
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

/**
 * Handle errors and send appropriate response
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Handle specific database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    if (err.message.includes('slug')) {
      message = 'A resource with this slug already exists';
    } else {
      message = 'Duplicate entry found';
    }
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  if (err.code === '22P02') { // PostgreSQL invalid input syntax
    statusCode = 400;
    message = 'Invalid input format';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};
