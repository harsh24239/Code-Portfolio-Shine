import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, trim: true, maxlength: 80 },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
    adminId: { type: String, default: '', index: true },
    ip: { type: String, default: '', maxlength: 120 },
    userAgent: { type: String, default: '', maxlength: 500 },
    details: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true },
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
