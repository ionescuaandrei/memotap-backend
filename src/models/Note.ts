import mongoose, { Schema, Document } from 'mongoose';
import { INote } from '../types';

export interface INoteDocument extends Omit<INote, '_id'>, Document {}

const noteSchema = new Schema<INoteDocument>(
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
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
noteSchema.index({ userId: 1, createdAt: -1 });

export const Note = mongoose.model<INoteDocument>('Note', noteSchema);
