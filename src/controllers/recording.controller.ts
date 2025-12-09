import { Response } from 'express';
import { Recording, Task, Note, Reminder } from '../models';
import { processAudioRecording } from '../services/ai.service';
import { AuthRequest } from '../types';
import { Types } from 'mongoose';

// Process audio recording - main endpoint
export const processRecording = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const { buffer, mimetype } = req.file;

    // Process audio with AI
    const { transcription, extracted } = await processAudioRecording(buffer, mimetype);

    if (!transcription) {
      res.status(400).json({ error: 'Could not transcribe audio. Please try again.' });
      return;
    }

    const userId = new Types.ObjectId(req.user.id);

    // Save recording
    const recording = await Recording.create({
      userId,
      transcription,
      processedAt: new Date(),
    });

    // Save extracted tasks
    const savedTasks = await Promise.all(
      extracted.tasks.map((task) =>
        Task.create({
          userId,
          recordingId: recording._id,
          task: task.task,
          day: task.day,
          hour: task.hour,
          done: false,
        })
      )
    );

    // Save extracted notes
    const savedNotes = await Promise.all(
      extracted.notes.map((note) =>
        Note.create({
          userId,
          recordingId: recording._id,
          title: note.title,
          content: note.content,
        })
      )
    );

    // Save extracted reminders
    const savedReminders = await Promise.all(
      extracted.reminders.map((reminder) =>
        Reminder.create({
          userId,
          recordingId: recording._id,
          message: reminder.message,
          remindAt: new Date(reminder.remindAt),
          notified: false,
        })
      )
    );

    res.status(201).json({
      success: true,
      recording: {
        id: recording._id,
        transcription: recording.transcription,
      },
      extracted: {
        tasks: savedTasks,
        notes: savedNotes,
        reminders: savedReminders,
      },
    });
  } catch (error) {
    console.error('Process recording error:', error);
    res.status(500).json({ error: 'Failed to process recording' });
  }
};

// Get all recordings for current user
export const getRecordings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const recordings = await Recording.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ recordings });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ error: 'Failed to get recordings' });
  }
};

// Get single recording with extracted data
export const getRecording = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const recording = await Recording.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    // Get associated data
    const [tasks, notes, reminders] = await Promise.all([
      Task.find({ recordingId: recording._id }),
      Note.find({ recordingId: recording._id }),
      Reminder.find({ recordingId: recording._id }),
    ]);

    res.json({
      recording,
      extracted: {
        tasks,
        notes,
        reminders,
      },
    });
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ error: 'Failed to get recording' });
  }
};

// Update recording transcription
export const updateRecording = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { transcription } = req.body;

    if (!transcription || typeof transcription !== 'string') {
      res.status(400).json({ error: 'Transcription is required' });
      return;
    }

    const recording = await Recording.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { transcription, updatedAt: new Date() },
      { new: true }
    );

    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    res.json({
      success: true,
      recording,
    });
  } catch (error) {
    console.error('Update recording error:', error);
    res.status(500).json({ error: 'Failed to update recording' });
  }
};

// Delete recording and all associated data
export const deleteRecording = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const recording = await Recording.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    // Delete all associated data
    await Promise.all([
      Task.deleteMany({ recordingId: recording._id }),
      Note.deleteMany({ recordingId: recording._id }),
      Reminder.deleteMany({ recordingId: recording._id }),
      Recording.deleteOne({ _id: recording._id }),
    ]);

    res.json({
      success: true,
      message: 'Recording and associated data deleted',
    });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
};
