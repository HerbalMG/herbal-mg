/**
 * Alternative async handler with better error context
 * Wraps async functions and passes errors to Express error handler
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Add request context to error
    err.path = req.path;
    err.method = req.method;
    next(err);
  });
};

module.exports = catchAsync;
