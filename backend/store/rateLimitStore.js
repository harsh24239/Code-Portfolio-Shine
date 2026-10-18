import crypto from 'node:crypto';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getSessionSecret } from '../config/security.js';
import { RateLimitCounter } from '../models/RateLimitCounter.js';

const memoryCounters = new Map();

const hashKey = (key) => crypto.createHmac('sha256', getSessionSecret()).update(String(key)).digest('hex');

const emptyResult = (limit, resetAt) => ({
  available: false,
  allowed: false,
  limit,
  remaining: 0,
  resetAt,
});

const createWindow = (windowMs) => {
  const resetAt = new Date(Date.now() + windowMs);
  return { resetAt, expiresAt: resetAt };
};

const isExpired = (record, now) => !record || new Date(record.resetAt) <= now;

const formatResult = (record, limit) => ({
  available: true,
  allowed: record.hits <= limit,
  limit,
  remaining: Math.max(0, limit - record.hits),
  resetAt: record.resetAt,
});

export const consumeRateLimit = async ({ key, limit, windowMs }) => {
  const keyHash = hashKey(key);
  const now = new Date();

  if (isDbConnected) {
    const window = createWindow(windowMs);
    const activeWindow = { $gt: ['$resetAt', now] };
    const updatePipeline = [
      {
        $set: {
          hits: {
            $cond: [
              activeWindow,
              { $add: [{ $ifNull: ['$hits', 0] }, 1] },
              1,
            ],
          },
          resetAt: { $cond: [activeWindow, '$resetAt', window.resetAt] },
          expiresAt: { $cond: [activeWindow, '$expiresAt', window.expiresAt] },
        },
      },
    ];

    let record;
    try {
      record = await RateLimitCounter.findOneAndUpdate(
        { keyHash },
        updatePipeline,
        { upsert: true, new: true },
      );
    } catch (error) {
      // Two first requests can race to create the unique counter. Retry the
      // same atomic increment after the winner has inserted the document.
      if (error?.code !== 11000) throw error;
      record = await RateLimitCounter.findOneAndUpdate(
        { keyHash },
        updatePipeline,
        { new: true },
      );
    }
    return formatResult(record, limit);
  }

  if (!allowInMemoryFallback) return emptyResult(limit, now);
  let record = memoryCounters.get(keyHash);
  if (isExpired(record, now)) {
    const window = createWindow(windowMs);
    record = { hits: 1, ...window };
  } else {
    record.hits += 1;
  }
  memoryCounters.set(keyHash, record);
  return formatResult(record, limit);
};
