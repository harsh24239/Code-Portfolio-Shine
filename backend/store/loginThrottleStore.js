import crypto from 'node:crypto';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getSessionSecret } from '../config/security.js';
import { AdminLoginThrottle } from '../models/AdminLoginThrottle.js';

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const memoryThrottle = new Map();

const hashKey = (key) => crypto.createHmac('sha256', getSessionSecret()).update(String(key)).digest('hex');

const emptyThrottle = () => ({ blocked: false, failures: 0 });

const isExpired = (record, now) => !record || new Date(record.expiresAt) <= now;

export const getLoginThrottle = async (key) => {
  const keyHash = hashKey(key);
  const now = new Date();

  if (isDbConnected) {
    const record = await AdminLoginThrottle.findOne({ keyHash });
    if (isExpired(record, now)) {
      if (record) await AdminLoginThrottle.deleteOne({ _id: record._id });
      return emptyThrottle();
    }
    return {
      blocked: Boolean(record.blockedUntil && new Date(record.blockedUntil) > now),
      failures: record.failures || 0,
    };
  }

  if (!allowInMemoryFallback) return emptyThrottle();
  const record = memoryThrottle.get(keyHash);
  if (isExpired(record, now)) {
    memoryThrottle.delete(keyHash);
    return emptyThrottle();
  }
  return {
    blocked: Boolean(record.blockedUntil && record.blockedUntil > now),
    failures: record.failures,
  };
};

export const registerLoginFailure = async (key) => {
  const keyHash = hashKey(key);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + FAILURE_WINDOW_MS);

  if (isDbConnected) {
    const existing = await AdminLoginThrottle.findOne({ keyHash });
    const failures = isExpired(existing, now) ? 1 : (existing.failures || 0) + 1;
    const blockedUntil = failures >= MAX_FAILURES ? expiresAt : null;
    await AdminLoginThrottle.findOneAndUpdate(
      { keyHash },
      { failures, blockedUntil, lastAttemptAt: now, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return { blocked: failures >= MAX_FAILURES, failures };
  }

  if (!allowInMemoryFallback) return { blocked: false, failures: 0 };
  const existing = memoryThrottle.get(keyHash);
  const failures = isExpired(existing, now) ? 1 : existing.failures + 1;
  const record = {
    failures,
    blockedUntil: failures >= MAX_FAILURES ? expiresAt : null,
    lastAttemptAt: now,
    expiresAt,
  };
  memoryThrottle.set(keyHash, record);
  return { blocked: failures >= MAX_FAILURES, failures };
};

export const clearLoginThrottle = async (key) => {
  const keyHash = hashKey(key);
  if (isDbConnected) await AdminLoginThrottle.deleteOne({ keyHash });
  memoryThrottle.delete(keyHash);
};
