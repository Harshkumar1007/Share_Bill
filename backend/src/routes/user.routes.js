import express from 'express';
import { searchUsers, updateProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure all routes in this sub-router

router.get('/', searchUsers);
router.put('/profile', updateProfile);

export default router;
