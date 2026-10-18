import mongoose from 'mongoose';

const adminLoginThrottleSchema = new mongoose.Schema(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    failures: { type: Number, default: 0, min: 0 },
    blockedUntil: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

adminLoginThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminLoginThrottle = mongoose.model('AdminLoginThrottle', adminLoginThrottleSchema);
