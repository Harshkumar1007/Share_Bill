/**
 * Validates that all required environment variables are set and properly formatted.
 * If any critical variables are missing or malformed, the process exits with status 1.
 */
export default function validateEnv() {
  const missingVars = [];

  // Check required environment variables
  if (!process.env.DATABASE_URL) {
    missingVars.push('DATABASE_URL');
  }
  if (!process.env.JWT_SECRET) {
    missingVars.push('JWT_SECRET');
  }

  if (missingVars.length > 0) {
    console.error('================================================================');
    console.error('FATAL STARTUP ERROR: Missing required environment variables:');
    missingVars.forEach((v) => {
      console.error(`  - ${v}`);
    });
    console.error('Please configure them in your environment or .env file.');
    console.error('================================================================');
    process.exit(1);
  }

  // Validate DATABASE_URL protocol
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('================================================================');
    console.error('FATAL STARTUP ERROR: DATABASE_URL must be a PostgreSQL connection string.');
    console.error('It must start with "postgresql://" or "postgres://".');
    console.error(`Received: "${dbUrl.substring(0, 15)}..."`);
    console.error('================================================================');
    process.exit(1);
  }

  // Warn about weak JWT_SECRET in production
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'dev_secret_share_bill_app_key_12345') {
    console.warn('================================================================');
    console.warn('WARNING: Using default JWT_SECRET in a production environment!');
    console.warn('This is highly insecure. Please supply a strong random secret.');
    console.warn('================================================================');
  }
}
