import mongoose, { Schema, Document } from 'mongoose';
import { ITask } from '../types';

export interface ITaskDocument extends Omit<ITask, '_id'>, Document {}

const taskSchema = new Schema<ITaskDocument>(
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
    task: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String, // ISO date: "2024-01-15"
      required: true,
    },
    hour: {
      type: String, // "14:00"
      required: false,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
taskSchema.index({ userId: 1, done: 1 });
taskSchema.index({ userId: 1, day: 1 });

export const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
