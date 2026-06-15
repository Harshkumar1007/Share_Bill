import express from 'express';
import { queryFinancialAgent } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure with JWT authorization

router.post('/query', queryFinancialAgent);

export default router;
