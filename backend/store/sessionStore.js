import crypto from 'node:crypto';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getSessionSecret, sessionTtlSeconds } from '../config/security.js';
import { AdminSession } from '../models/AdminSession.js';
import { AdminMfaChallenge } from '../models/AdminMfaChallenge.js';

const memorySessions = new Map();
const memoryMfaChallenges = new Map();

const digest = (value) => crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');

const sessionExpiry = () => new Date(Date.now() + sessionTtlSeconds * 1000);

export const createSession = async ({
  adminId,
  tokenVersion,
  csrfToken: existingCsrfToken = '',
  mfaVerified = false,
  ip = '',
  userAgent = '',
}) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const csrfToken = existingCsrfToken || crypto.randomBytes(32).toString('base64url');
  const session = {
    adminId: String(adminId),
    tokenVersion,
    mfaVerified,
    csrfHash: digest(csrfToken),
    ip: String(ip || '').slice(0, 120),
    userAgent: String(userAgent || '').slice(0, 500),
    lastActivityAt: new Date(),
    expiresAt: sessionExpiry(),
  };

  if (isDbConnected) {
    const created = await AdminSession.create({ tokenHash: digest(token), ...session });
    return { token, csrfToken, expiresAt: created.expiresAt, sessionId: String(created._id) };
  } else if (allowInMemoryFallback) {
    const sessionId = crypto.randomUUID();
    memorySessions.set(digest(token), { _id: sessionId, ...session });
    return { token, csrfToken, expiresAt: session.expiresAt, sessionId };
  }

  return { token, csrfToken, expiresAt: session.expiresAt, sessionId: '' };
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

export const listAdminSessions = async (adminId) => {
  const normalizedId = String(adminId);
  const now = new Date();
  if (isDbConnected) {
    await AdminSession.deleteMany({ adminId: normalizedId, expiresAt: { $lte: now } });
    const sessions = await AdminSession.find({ adminId: normalizedId, expiresAt: { $gt: now } })
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .lean();
    return sessions.map((session) => ({ ...session, _id: String(session._id) }));
  }

  if (!allowInMemoryFallback) return [];
  return [...memorySessions.values()]
    .filter((session) => session.adminId === normalizedId && session.expiresAt > now)
    .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
};

export const revokeAdminSession = async (adminId, sessionId) => {
  const normalizedId = String(adminId);
  if (isDbConnected) {
    const deleted = await AdminSession.findOneAndDelete({ _id: sessionId, adminId: normalizedId });
    return Boolean(deleted);
  }

  if (!allowInMemoryFallback) return false;
  for (const [tokenHash, session] of memorySessions) {
    if (session._id === sessionId && session.adminId === normalizedId) {
      memorySessions.delete(tokenHash);
      return true;
    }
  }
  return false;
};

export const revokeOtherAdminSessions = async (adminId, currentSessionId) => {
  const normalizedId = String(adminId);
  if (isDbConnected) {
    const result = await AdminSession.deleteMany({ adminId: normalizedId, _id: { $ne: currentSessionId } });
    return result.deletedCount || 0;
  }

  if (!allowInMemoryFallback) return 0;
  let count = 0;
  for (const [tokenHash, session] of memorySessions) {
    if (session.adminId === normalizedId && session._id !== currentSessionId) {
      memorySessions.delete(tokenHash);
      count += 1;
    }
  }
  return count;
};

export const touchSession = async (token) => {
  if (!token) return;
  const tokenHash = digest(token);
  const lastActivityAt = new Date();
  if (isDbConnected) {
    await AdminSession.updateOne({ tokenHash }, { $set: { lastActivityAt } });
    return;
  }
  const session = memorySessions.get(tokenHash);
  if (session) session.lastActivityAt = lastActivityAt;
};

export const verifyCsrf = (session, csrfToken) => Boolean(
  session && csrfToken && crypto.timingSafeEqual(
    Buffer.from(session.csrfHash),
    Buffer.from(digest(csrfToken)),
  ),
);

export const createMfaChallenge = async (adminId, tokenVersion = 0) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const challenge = {
    adminId: String(adminId),
    tokenVersion,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
  };
  const challengeHash = digest(token);

  if (isDbConnected) {
    await AdminMfaChallenge.create({ challengeHash, ...challenge });
  } else if (allowInMemoryFallback) {
    memoryMfaChallenges.set(challengeHash, challenge);
  }

  return { token, expiresAt: challenge.expiresAt };
};

export const consumeMfaChallenge = async (token) => {
  if (!token) return null;
  const challengeHash = digest(token);
  if (isDbConnected) {
    // Reserve an attempt before any expensive verification; concurrent guesses
    // must compete for the same five slots across every server instance.
    const challenge = await AdminMfaChallenge.findOneAndUpdate(
      { challengeHash, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!challenge) return null;
    return { ...challenge.toObject(), challengeHash };
  }

  if (!allowInMemoryFallback) return null;
  const challenge = memoryMfaChallenges.get(challengeHash);
  if (!challenge || challenge.expiresAt <= new Date()) {
    memoryMfaChallenges.delete(challengeHash);
    return null;
  }
  if (challenge.attempts >= 5) return null;
  challenge.attempts += 1;
  return { ...challenge, challengeHash };
};

export const redeemMfaChallenge = async (token) => {
  if (!token) return false;
  const challengeHash = digest(token);
  if (isDbConnected) {
    const result = await AdminMfaChallenge.deleteOne({
      challengeHash, expiresAt: { $gt: new Date() }, attempts: { $gte: 1, $lte: 5 },
    });
    return result.deletedCount === 1;
  }
  if (!allowInMemoryFallback) return false;
  const challenge = memoryMfaChallenges.get(challengeHash);
  if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts < 1 || challenge.attempts > 5) return false;
  return memoryMfaChallenges.delete(challengeHash);
};

export const destroyMfaChallenge = async (token) => {
  if (!token) return;
  const challengeHash = digest(token);
  if (isDbConnected) await AdminMfaChallenge.deleteOne({ challengeHash });
  memoryMfaChallenges.delete(challengeHash);
};
