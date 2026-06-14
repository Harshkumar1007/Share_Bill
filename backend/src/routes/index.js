import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import groupRoutes from './group.routes.js';
import importRoutes from './import.routes.js';
import globalExpenseRoutes from './globalExpense.routes.js';
import activityRoutes from './activity.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/import', importRoutes);
router.use('/expenses', globalExpenseRoutes);
router.use('/activities', activityRoutes);

export default router;
