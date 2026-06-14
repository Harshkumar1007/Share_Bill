// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev mode
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Prisma Unique Constraint violation (P2002)
  if (err.code === 'P2002') {
    const field = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return res.status(400).json({
      success: false,
      error: `Duplicate field value entered: ${field}`
    });
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: err.meta?.cause || 'Resource not found'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token failed'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token expired'
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
};
