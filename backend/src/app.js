import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import prisma from './services/prisma.service.js';
import { requestLogger } from './middleware/logger.middleware.js';

const app = express();

// Request Logger
app.use(requestLogger);

// Configure CORS
const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Support wildcard subdomains (e.g. *.vercel.app)
    const matchesWildcard = allowedOrigins.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return origin.endsWith(domain) || origin === `https://${domain}` || origin === `http://${domain}`;
      }
      return false;
    });

    if (matchesWildcard) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy blocked request from origin: ${origin}`), false);
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB-connected health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: 'UP',
        api: 'UP'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      services: {
        database: 'DOWN',
        api: 'UP'
      },
      error: error.message
    });
  }
});

// Keep legacy /health endpoint for simple status checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Share Bill backend is healthy' });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);


export default app;
