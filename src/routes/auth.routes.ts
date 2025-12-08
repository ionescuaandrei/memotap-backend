import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  signOut,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register - Register with email/password
router.post('/register', register);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authMiddleware, getCurrentUser);

// POST /api/auth/signout - Sign out (protected)
router.post('/signout', authMiddleware, signOut);

export default router;
