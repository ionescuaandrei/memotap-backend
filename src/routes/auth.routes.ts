import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getCurrentUser,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register - Register with email/password
router.post('/register', register);

// POST /api/auth/login - Login with email/password
router.post('/login', login);

// POST /api/auth/google - Google OAuth login/register
router.post('/google', googleAuth);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authMiddleware, getCurrentUser);

export default router;
