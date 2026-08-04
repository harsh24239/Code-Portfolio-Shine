import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('⚠  No MONGO_URI set. Data will NOT persist across Render restarts.');
    console.log('   Add MONGO_URI to Render environment variables to enable persistence.');
    isDbConnected = false;
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s — longer for Render cold starts
      connectTimeoutMS: 10000,
    });
    isDbConnected = true;
    console.log(`✓ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    isDbConnected = false;
    console.error(`✗ MongoDB connection failed: ${error.message}`);
    console.log('  Running with in-memory defaults — data will reset on restart.');
  }
};
