import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
  removeMember,
  getGroupBalances
} from '../controllers/group.controller.js';
import expenseRouter from './expense.routes.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure all group endpoints

// Nest expense endpoints under /api/groups/:groupId/expenses
router.use('/:groupId/expenses', expenseRouter);

router.route('/')
  .post(createGroup)
  .get(getGroups);

router.route('/:id')
  .get(getGroupById);

router.route('/:id/members')
  .post(addMember);

router.route('/:id/members/:userId')
  .delete(removeMember);

router.route('/:id/balances')
  .get(getGroupBalances);

export default router;
