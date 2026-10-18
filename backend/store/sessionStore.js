import crypto from 'node:crypto';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getSessionSecret, sessionTtlSeconds } from '../config/security.js';
import { AdminSession } from '../models/AdminSession.js';

const memorySessions = new Map();

const digest = (value) => crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');

const sessionExpiry = () => new Date(Date.now() + sessionTtlSeconds * 1000);

export const createSession = async ({ adminId, tokenVersion, csrfToken: existingCsrfToken = '' }) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const csrfToken = existingCsrfToken || crypto.randomBytes(32).toString('base64url');
  const session = {
    adminId: String(adminId),
    tokenVersion,
    csrfHash: digest(csrfToken),
    expiresAt: sessionExpiry(),
  };

  if (isDbConnected) {
    await AdminSession.create({ tokenHash: digest(token), ...session });
  } else if (allowInMemoryFallback) {
    memorySessions.set(digest(token), session);
  }

  return { token, csrfToken, expiresAt: session.expiresAt };
};

export const getSession = async (token) => {
  if (!token) return null;
  const tokenHash = digest(token);
  if (isDbConnected) {
    const session = await AdminSession.findOne({ tokenHash });
    if (!session || session.expiresAt <= new Date()) {
      if (session) await AdminSession.deleteOne({ _id: session._id });
      return null;
    }
    return session.toObject();
  }

  if (!allowInMemoryFallback) return null;
  const session = memorySessions.get(tokenHash);
  if (!session || session.expiresAt <= new Date()) {
    memorySessions.delete(tokenHash);
    return null;
  }
  return session;
};

export const destroySession = async (token) => {
  if (!token) return;
  const tokenHash = digest(token);
  if (isDbConnected) await AdminSession.deleteOne({ tokenHash });
  memorySessions.delete(tokenHash);
};

export const destroyAdminSessions = async (adminId) => {
  const normalizedId = String(adminId);
  if (isDbConnected) await AdminSession.deleteMany({ adminId: normalizedId });
  for (const [tokenHash, session] of memorySessions) {
    if (session.adminId === normalizedId) memorySessions.delete(tokenHash);
  }
};

export const verifyCsrf = (session, csrfToken) => Boolean(
  session && csrfToken && crypto.timingSafeEqual(
    Buffer.from(session.csrfHash),
    Buffer.from(digest(csrfToken)),
  ),
);
