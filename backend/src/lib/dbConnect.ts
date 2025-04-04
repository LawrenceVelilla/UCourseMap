// --- START OF FILE lib/dbConnect.ts ---
import mongoose from 'mongoose';

// Ensure the MONGODB_URI is set in your environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 * In production, the caching serves primarily to reuse connections between
 * serverless function invocations if the container is reused.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS Global type to include mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}


let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  // If a connection is already cached, return it
  if (cached.conn) {
    console.log(' Mongoose: Using cached connection.');
    return cached.conn;
  }

  // If a connection promise is pending, wait for it to resolve
  if (cached.promise) {
    console.log(' Mongoose: Awaiting existing connection promise.');
    return await cached.promise;
  }

  // If no connection or promise exists, create a new one
  console.log(' Mongoose: Creating new connection.');
  const opts = {
    bufferCommands: false, // Disable buffering (recommended for serverless)
    // useNewUrlParser: true, // Deprecated in Mongoose 6+
    // useUnifiedTopology: true, // Deprecated in Mongoose 6+
  };

  try {
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log(' Mongoose: Connection established.');
      cached.conn = mongooseInstance; // Cache the connection instance
      return mongooseInstance;
    }).catch(err => {
      console.error(' Mongoose: Connection error:', err);
      cached.promise = null; // Clear the promise on error so next attempt can retry
      throw err; // Re-throw error after logging
    });

    return await cached.promise;

  } catch (e) {
    console.error(' Mongoose: Failed to initiate connection:', e);
    // Ensure promise is cleared if initial connect call itself throws
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
// --- END OF FILE lib/dbConnect.ts ---