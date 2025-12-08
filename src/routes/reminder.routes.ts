import { Router } from 'express';
import {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
} from '../controllers/reminder.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All reminder routes require authentication
router.use(authMiddleware);

// GET /api/reminders - Get all reminders (supports ?notified=true/false)
router.get('/', getReminders);

// GET /api/reminders/:id - Get single reminder
router.get('/:id', getReminder);

// POST /api/reminders - Create reminder
router.post('/', createReminder);

// PATCH /api/reminders/:id - Update reminder
router.patch('/:id', updateReminder);

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', deleteReminder);

export default router;
