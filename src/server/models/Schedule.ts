import mongoose, { Document, Schema } from 'mongoose';
import dbConnect from '../utils/db';

// Ensure database connection
dbConnect().catch(console.error);

// Define the event subdocument schema
const EventSchema = new Schema({
  title: { type: String, required: true },
  day: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: { type: Number, required: true, min: 0, max: 23.75 }, // 0-23.75 (in 15-minute increments)
  duration: { type: Number, required: true, min: 0.25, max: 24 }, // in hours
  type: {
    type: String,
    required: true,
    enum: ['work', 'meeting', 'deep-work', 'workout', 'meals', 'break', 'personal', 'learning', 'relaxation', 'commute', 'sleep']
  },
  description: { type: String }
});

// Define the main schedule schema
const ScheduleSchema = new Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true,
    default: 'My Schedule'
  },
  events: [EventSchema],
  preferences: {
    workHours: String,
    deepWorkHours: Number,
    personalActivities: [String],
    workoutTime: String,
    meetingPreference: String,
    meetingsPerDay: Number,
    customPreferences: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create a compound index for faster lookups
ScheduleSchema.index({ userId: 1, isDefault: 1 });

// Create the model if it doesn't exist
export interface ISchedule extends Document {
  userId: string;
  title: string;
  events: Array<{
    title: string;
    day: number;
    hour: number;
    duration: number;
    type: string;
    description?: string;
  }>;
  preferences: {
    workHours?: string;
    deepWorkHours?: number;
    personalActivities?: string[];
    workoutTime?: string;
    meetingPreference?: string;
    meetingsPerDay?: number;
    customPreferences?: string;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Schedule = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default Schedule;
