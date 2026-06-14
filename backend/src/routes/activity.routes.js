import express from 'express';
import { getLogs } from '../controllers/activity.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure activity routes with JWT

router.get('/', getLogs);

export default router;
