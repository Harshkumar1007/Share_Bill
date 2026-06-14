import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Share Bill backend is healthy' });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
