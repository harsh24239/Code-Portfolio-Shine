import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('✗ MONGO_URI is not configured. Persistent storage is unavailable.');
    isDbConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s — longer for Render cold starts
      connectTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log(`✓ MongoDB Atlas connected: ${conn.connection.host}`);
    mongoose.connection.on('disconnected', () => {
      isDbConnected = false;
      console.error('✗ MongoDB disconnected. Admin writes are now blocked.');
    });
    mongoose.connection.on('error', (error) => {
      isDbConnected = false;
      console.error(`✗ MongoDB connection error: ${error.message}`);
    });
    return true;
  } catch (error) {
    isDbConnected = false;
    console.error(`✗ MongoDB connection failed: ${error.message}`);
    return false;
  }
};
