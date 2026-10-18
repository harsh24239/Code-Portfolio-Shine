import mongoose from 'mongoose';

const rateLimitCounterSchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    hits: { type: Number, default: 0, min: 0 },
    resetAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

rateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitCounter = mongoose.model('RateLimitCounter', rateLimitCounterSchema);
