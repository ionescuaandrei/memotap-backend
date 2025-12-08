import mongoose, { Schema, Document } from 'mongoose';
import { IReminder } from '../types';

export interface IReminderDocument extends Omit<IReminder, '_id'>, Document {}

const reminderSchema = new Schema<IReminderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordingId: {
      type: Schema.Types.ObjectId,
      ref: 'Recording',
      required: false,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    remindAt: {
      type: Date,
      required: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
reminderSchema.index({ userId: 1, remindAt: 1 });
reminderSchema.index({ notified: 1, remindAt: 1 }); // For reminder job

export const Reminder = mongoose.model<IReminderDocument>('Reminder', reminderSchema);
