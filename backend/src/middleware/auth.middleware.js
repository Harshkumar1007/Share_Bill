import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_share_bill_app_key_12345');

      // Fetch user from DB and attach to req, excluding password
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true
        }
      });

      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};
