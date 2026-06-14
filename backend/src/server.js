import 'dotenv/config';
import validateEnv from './config/validateEnv.js';
import app from './app.js';
import prisma from './services/prisma.service.js';

// Validate required environment variables at startup
validateEnv();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      // Disconnect Prisma Client properly
      await prisma.$disconnect();
      console.log('Database client disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnection:', err.message);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

