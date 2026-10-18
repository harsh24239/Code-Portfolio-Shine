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

const safeInteger = (value, fallback, maximum) => Math.min(maximum, Math.max(1, Number.parseInt(value, 10) || fallback));

const buildAuditFilter = ({ event = '', outcome = '', from = '', to = '' } = {}) => {
  const filter = {};
  const normalizedEvent = String(event).trim().slice(0, 80);
  if (normalizedEvent) filter.event = normalizedEvent;
  if (outcome === 'success' || outcome === 'failure') filter.outcome = outcome;

  const createdAt = {};
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.$gte = fromDate;
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.$lte = toDate;
  if (Object.keys(createdAt).length > 0) filter.createdAt = createdAt;
  return filter;
};

export const listAuditEvents = async ({ page = 1, limit = 25, event = '', outcome = '', from = '', to = '' } = {}) => {
  const safePage = safeInteger(page, 1, 10_000);
  const safeLimit = safeInteger(limit, 25, 100);
  const filter = buildAuditFilter({ event, outcome, from, to });

  if (isDbConnected) {
    const [total, events] = await Promise.all([
      AdminAuditLog.countDocuments(filter),
      AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    ]);
    return {
      events: events.map((entry) => ({ ...entry, _id: String(entry._id) })),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }
  if (!allowInMemoryFallback) return { events: [], page: safePage, limit: safeLimit, total: 0, totalPages: 1 };

  const events = memoryAuditLogs
    .filter((entry) => {
      if (filter.event && entry.event !== filter.event) return false;
      if (filter.outcome && entry.outcome !== filter.outcome) return false;
      if (filter.createdAt?.$gte && new Date(entry.createdAt) < filter.createdAt.$gte) return false;
      if (filter.createdAt?.$lte && new Date(entry.createdAt) > filter.createdAt.$lte) return false;
      return true;
    });
  const start = (safePage - 1) * safeLimit;
  return {
    events: events.slice(start, start + safeLimit),
    page: safePage,
    limit: safeLimit,
    total: events.length,
    totalPages: Math.max(1, Math.ceil(events.length / safeLimit)),
  };
};
