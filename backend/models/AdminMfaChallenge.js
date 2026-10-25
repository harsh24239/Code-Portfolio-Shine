import mongoose from 'mongoose';

const adminMfaChallengeSchema = new mongoose.Schema(
  {
    challengeHash: { type: String, required: true, unique: true, index: true },
    adminId: { type: String, required: true, index: true },
    tokenVersion: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

adminMfaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminMfaChallenge = mongoose.model('AdminMfaChallenge', adminMfaChallengeSchema);
