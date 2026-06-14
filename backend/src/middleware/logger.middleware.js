/**
 * Express middleware to log HTTP requests to stdout.
 * Outputs format: [Timestamp] METHOD URL Status - ResponseTime ms
 */
export const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationMs = (duration[0] * 1e3 + duration[1] * 1e-6).toFixed(2);
    const timestamp = new Date().toISOString();
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Use console.log for request tracing, which is standard in container environments
    console.log(`[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${durationMs} ms`);
  });

  next();
};
