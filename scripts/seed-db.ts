import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models
import Schedule from '../src/server/models/Schedule';
import dbConnect from '../src/server/utils/db';

// Sample data
const sampleSchedules = [
  {
    userId: 'sample-user-1',
    title: 'Sample Work Week',
    isDefault: true,
    preferences: {
      workHours: '9am-5pm',
      deepWorkHours: 2,
      personalActivities: ['gym', 'reading'],
      workoutTime: '6pm-7pm',
      meetingPreference: 'afternoon',
      meetingsPerDay: 2,
      customPreferences: 'Need time for team syncs'
    },
    events: [
      {
        title: 'Morning Standup',
        day: 1,
        hour: 9,
        duration: 0.5,
        type: 'meeting',
        description: 'Daily team sync'
      },
      {
        title: 'Deep Work',
        day: 1,
        hour: 10,
        duration: 2,
        type: 'deep-work',
        description: 'Focus time for coding'
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Schedule.deleteMany({});
    console.log('Cleared existing schedules');

    // Insert sample data
    const createdSchedules = await Schedule.insertMany(sampleSchedules);
    console.log(`Inserted ${createdSchedules.length} sample schedules`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
