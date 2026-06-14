import express from 'express';
import {
  createExpense,
  getExpensesByGroup,
  deleteExpense,
  settleUp,
  deleteSettlement
} from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect); // Secure all expense routes

router.route('/')
  .post(createExpense)
  .get(getExpensesByGroup);

router.route('/:id')
  .delete(deleteExpense);

router.route('/settle')
  .post(settleUp);

router.route('/settlements/:id')
  .delete(deleteSettlement);

export default router;
