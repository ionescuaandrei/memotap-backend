import { Router } from 'express';
import {
  processRecording,
  getRecordings,
  getRecording,
  updateRecording,
  deleteRecording,
} from '../controllers/recording.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadAudio } from '../middleware/upload.middleware';

const router = Router();

// All recording routes require authentication
router.use(authMiddleware);

// POST /api/recordings/process - Upload and process audio
router.post('/process', uploadAudio, processRecording);

// GET /api/recordings - Get all recordings for current user
router.get('/', getRecordings);

// GET /api/recordings/:id - Get single recording with extracted data
router.get('/:id', getRecording);

// PUT /api/recordings/:id - Update recording transcription
router.put('/:id', updateRecording);

// DELETE /api/recordings/:id - Delete recording and associated data
router.delete('/:id', deleteRecording);

export default router;
