/**
 * middleware/error.middleware.js
 * Centralised error handling — all unhandled errors funnel here.
 * Never leaks stack traces in production.
 */

/**
 * 404 handler — catches requests that matched no route.
 */
function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

/**
 * Global error handler.
 * Mongoose validation errors, JWT errors, and generic errors all normalised here.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isDev  = process.env.NODE_ENV !== 'production';
  let status   = err.statusCode || err.status || 500;
  let message  = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status  = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    status  = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists.`;
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    status  = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { status = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError')  { status = 401; message = 'Token expired. Please log in again.'; }

  if (isDev) console.error(`[ERROR] ${status} ${req.method} ${req.path}:`, err.message);

  res.status(status).json({
    success: false,
    error:   message,
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
