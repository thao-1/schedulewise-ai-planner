import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import models
import dbConnect from '../src/server/utils/db';

async function dropDatabase() {
  try {
    // Connect to MongoDB
    const connection = await dbConnect();
    
    // Drop the database
    await connection.connection.dropDatabase();
    console.log('Database dropped successfully');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping database:', error);
    process.exit(1);
  }
}

dropDatabase();
