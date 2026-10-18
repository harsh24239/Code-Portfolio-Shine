import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback } from '../config/security.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';

const memoryAuditLogs = [];
const MAX_MEMORY_AUDIT_LOGS = 100;

const requestMetadata = (req) => ({
  ip: String(req?.ip || '').slice(0, 120),
  userAgent: String(req?.headers?.['user-agent'] || '').slice(0, 500),
});

export const recordAuditEvent = async ({ event, outcome = 'success', adminId = '', req, details = '' }) => {
  const entry = {
    event: String(event).slice(0, 80),
    outcome: outcome === 'failure' ? 'failure' : 'success',
    adminId: String(adminId || ''),
    ...requestMetadata(req),
    details: String(details || '').slice(0, 500),
  };

  try {
    if (isDbConnected) {
      await AdminAuditLog.create(entry);
    } else if (allowInMemoryFallback) {
      memoryAuditLogs.unshift({ _id: `memory_audit_${Date.now()}_${Math.random().toString(36).slice(2)}`, ...entry, createdAt: new Date() });
      memoryAuditLogs.splice(MAX_MEMORY_AUDIT_LOGS);
    }
  } catch (error) {
    console.warn('Unable to persist admin audit event:', error.message);
  }
};

export const listAuditEvents = async (limit = 50) => {
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
  if (isDbConnected) {
    const events = await AdminAuditLog.find().sort({ createdAt: -1 }).limit(safeLimit).lean();
    return events.map((event) => ({ ...event, _id: String(event._id) }));
  }
  if (!allowInMemoryFallback) return [];
  return memoryAuditLogs.slice(0, safeLimit);
};
