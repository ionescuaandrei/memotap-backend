import mongoose, { Schema, Document } from 'mongoose';
import { IRecording } from '../types';

export interface IRecordingDocument extends Omit<IRecording, '_id'>, Document {}

const recordingSchema = new Schema<IRecordingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transcription: {
      type: String,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
recordingSchema.index({ userId: 1, createdAt: -1 });

export const Recording = mongoose.model<IRecordingDocument>('Recording', recordingSchema);
