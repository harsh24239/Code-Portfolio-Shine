import mongoose from 'mongoose';

const adminSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    adminId: { type: String, required: true, index: true },
    tokenVersion: { type: Number, required: true },
    mfaVerified: { type: Boolean, default: false },
    csrfHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminSession = mongoose.model('AdminSession', adminSessionSchema);
