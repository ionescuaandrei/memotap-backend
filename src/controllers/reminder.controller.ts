import { Response } from 'express';
import { Reminder } from '../models';
import { AuthRequest } from '../types';

// Get all reminders for current user
export const getReminders = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { notified } = req.query;

    const filter: Record<string, unknown> = { userId: req.user.id };
    if (notified !== undefined) {
      filter.notified = notified === 'true';
    }

    const reminders = await Reminder.find(filter).sort({ remindAt: 1 });

    res.json({ reminders });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ error: 'Failed to get reminders' });
  }
};

// Get single reminder
export const getReminder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const reminder = await Reminder.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ error: 'Failed to get reminder' });
  }
};

// Create reminder manually
export const createReminder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { message, remindAt } = req.body;

    if (!message || !remindAt) {
      res.status(400).json({ error: 'Message and remindAt are required' });
      return;
    }

    const reminder = await Reminder.create({
      userId: req.user.id,
      message,
      remindAt: new Date(remindAt),
      notified: false,
    });

    res.status(201).json({ reminder });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

// Update reminder
export const updateReminder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { message, remindAt, notified } = req.body;

    const updateData: Record<string, unknown> = {};
    if (message !== undefined) updateData.message = message;
    if (remindAt !== undefined) updateData.remindAt = new Date(remindAt);
    if (notified !== undefined) updateData.notified = notified;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
};

// Delete reminder
export const deleteReminder = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found' });
      return;
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
};
