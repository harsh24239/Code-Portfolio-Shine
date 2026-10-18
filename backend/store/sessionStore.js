import crypto from 'node:crypto';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, getSessionSecret, sessionTtlSeconds } from '../config/security.js';
import { AdminSession } from '../models/AdminSession.js';
import { AdminMfaChallenge } from '../models/AdminMfaChallenge.js';

const memorySessions = new Map();
const memoryMfaChallenges = new Map();

const digest = (value) => crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');

const sessionExpiry = () => new Date(Date.now() + sessionTtlSeconds * 1000);

export const createSession = async ({ adminId, tokenVersion, csrfToken: existingCsrfToken = '', mfaVerified = false }) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const csrfToken = existingCsrfToken || crypto.randomBytes(32).toString('base64url');
  const session = {
    adminId: String(adminId),
    tokenVersion,
    mfaVerified,
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

export const createMfaChallenge = async (adminId) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const challenge = {
    adminId: String(adminId),
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
    const challenge = await AdminMfaChallenge.findOne({ challengeHash });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
      if (challenge) await AdminMfaChallenge.deleteOne({ _id: challenge._id });
      return null;
    }
    return { ...challenge.toObject(), challengeHash };
  }

  if (!allowInMemoryFallback) return null;
  const challenge = memoryMfaChallenges.get(challengeHash);
  if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
    memoryMfaChallenges.delete(challengeHash);
    return null;
  }
  return { ...challenge, challengeHash };
};

export const incrementMfaChallengeAttempts = async (challenge) => {
  if (!challenge) return;
  if (isDbConnected) {
    await AdminMfaChallenge.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
    return;
  }
  const current = memoryMfaChallenges.get(challenge.challengeHash);
  if (current) current.attempts += 1;
};

export const destroyMfaChallenge = async (token) => {
  if (!token) return;
  const challengeHash = digest(token);
  if (isDbConnected) await AdminMfaChallenge.deleteOne({ challengeHash });
  memoryMfaChallenges.delete(challengeHash);
};
