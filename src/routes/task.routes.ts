import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks - Get all tasks (supports ?done=true/false&day=2024-01-15)
router.get('/', getTasks);

// GET /api/tasks/:id - Get single task
router.get('/:id', getTask);

// POST /api/tasks - Create task
router.post('/', createTask);

// PATCH /api/tasks/:id - Update task
router.patch('/:id', updateTask);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', deleteTask);

export default router;
