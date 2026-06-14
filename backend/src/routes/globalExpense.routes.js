import express from 'express';
import { getAllUserExpenses } from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure with JWT authorization

router.route('/')
  .get(getAllUserExpenses);

export default router;
