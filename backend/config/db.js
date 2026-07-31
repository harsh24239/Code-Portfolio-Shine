import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('ℹ No MONGO_URI provided in environment. Running with resilient in-memory store.');
    isDbConnected = false;
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    isDbConnected = true;
    console.log(`✓ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    isDbConnected = false;
    console.warn(`⚠ MongoDB Connection Warning: ${error.message}`);
    console.log(`Running backend with resilient in-memory store until MONGO_URI is connected.`);
  }
};
