import mongoose from 'mongoose';
import { env } from './env.js';

// Only fields defined in schemas can be used in query filters.
// (NoSQL-injection protection also comes from express-mongo-sanitize + request validation.)
mongoose.set('strictQuery', true);

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    console.error('[db] Check MONGO_URI in server/.env and make sure MongoDB is running.');
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
