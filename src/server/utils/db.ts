import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/schedulewise';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Extend the NodeJS global type with our mongoose cache
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache if it doesn't exist
const globalWithMongoose = global as typeof globalThis & {
  mongoose: MongooseCache;
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

// Set up database connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Close the connection when the Node process ends
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts);
      // Wait for the connection to be established
      cached.conn = await cached.promise;
      console.log('MongoDB connection established');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  } else {
    // Wait for the existing connection promise to resolve
    try {
      cached.conn = await cached.promise;
    } catch (error) {
      // If the connection fails, clear the cache to allow retries
      cached.promise = null;
      throw error;
    }
  }

  return cached.conn!;
}

export default dbConnect;
