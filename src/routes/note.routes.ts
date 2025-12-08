import { Router } from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All note routes require authentication
router.use(authMiddleware);

// GET /api/notes - Get all notes
router.get('/', getNotes);

// GET /api/notes/:id - Get single note
router.get('/:id', getNote);

// POST /api/notes - Create note
router.post('/', createNote);

// PATCH /api/notes/:id - Update note
router.patch('/:id', updateNote);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', deleteNote);

export default router;
