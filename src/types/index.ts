import { Request } from 'express';
import { Types } from 'mongoose';

// User types
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task types
export interface ITask {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recordingId?: Types.ObjectId;
  task: string;
  day: string; // ISO date: "2024-01-15"
  hour?: string; // "14:00"
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note types
export interface INote {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recordingId?: Types.ObjectId;
  content: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Reminder types
export interface IReminder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recordingId?: Types.ObjectId;
  message: string;
  remindAt: Date;
  notified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Recording types
export interface IRecording {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  transcription: string;
  processedAt: Date;
  createdAt: Date;
}

// Auth types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
}

// AI extraction types
export interface ExtractedTask {
  task: string;
  day: string;
  hour?: string;
}

export interface ExtractedNote {
  title?: string;
  content: string;
}

export interface ExtractedReminder {
  message: string;
  remindAt: string; // ISO date string
}

export interface AIExtractionResult {
  tasks: ExtractedTask[];
  notes: ExtractedNote[];
  reminders: ExtractedReminder[];
}

// API Response types
export interface ProcessingResponse {
  success: boolean;
  recording: {
    id: string;
    transcription: string;
  };
  extracted: {
    tasks: ITask[];
    notes: INote[];
    reminders: IReminder[];
  };
}
