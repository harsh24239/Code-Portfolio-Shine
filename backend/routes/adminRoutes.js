import express from 'express';
import bcrypt from 'bcryptjs';
import { toDataURL } from 'qrcode';
import { isDbConnected } from '../config/db.js';
import { allowInMemoryFallback, assertAdminStorageAvailable, csrfCookieName, sessionCookieName, sessionTtlSeconds } from '../config/security.js';
import { memoryStore } from '../store/memoryStore.js';
import { Admin } from '../models/Admin.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { FocusArea } from '../models/FocusArea.js';
import { Message } from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import { requireCsrf, issueCsrfToken } from '../middleware/csrf.js';
import { consumeMfaChallenge, createMfaChallenge, createSession, destroyAdminSessions, destroyMfaChallenge, destroySession, redeemMfaChallenge, listAdminSessions, revokeAdminSession, revokeOtherAdminSessions } from '../store/sessionStore.js';
import { claimMfaProof } from '../store/mfaProofStore.js';
import { listAuditEvents, recordAuditEvent } from '../store/auditStore.js';
import { clearLoginThrottle, getLoginThrottle, registerLoginFailure } from '../store/loginThrottleStore.js';
import { appendCookie, parseCookies, serializeCookie } from '../utils/cookies.js';
import { isValidEmail, normalizeText, normalizeUrl } from '../utils/validation.js';
import { createTotpSetup, generateBackupCodes, normalizeBackupCode, verifyTotp } from '../utils/totp.js';
import { decryptSecret, encryptSecret } from '../utils/secretBox.js';

const router = express.Router();

const mfaChallengeCookieName = 'portfolio_admin_mfa_challenge';

// ─── Credential Helpers ───────────────────────────────────────────────────────
// Always read from memoryStore (synced from MongoDB on startup)
const getAdminUsername = () =>
  memoryStore.adminCredentials?.username || process.env.ADMIN_USERNAME || '';

const getAdminPasswordHash = () => {
  return memoryStore.adminCredentials?.passwordHash || '';
};

const requireAdminStorage = (res) => {
  const status = assertAdminStorageAvailable();
  if (!isDbConnected && !allowInMemoryFallback) {
    res.status(503).json({ message: status.message });
    return false;
  }
  return true;
};

const getLoginKey = (req, username) => `${req.ip}:${String(username || '').trim().toLowerCase()}`;

const setSessionCookies = (res, { token, csrfToken }) => {
  const secure = process.env.NODE_ENV === 'production';
  appendCookie(res, serializeCookie(sessionCookieName, token, {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    maxAge: sessionTtlSeconds,
  }));
  appendCookie(res, serializeCookie(csrfCookieName, csrfToken, {
    secure,
    sameSite: 'Lax',
    maxAge: sessionTtlSeconds,
  }));
};

const clearSessionCookies = (res) => {
  const secure = process.env.NODE_ENV === 'production';
  appendCookie(res, serializeCookie(sessionCookieName, '', { httpOnly: true, secure, sameSite: 'Lax', maxAge: 0 }));
  appendCookie(res, serializeCookie(csrfCookieName, '', { secure, sameSite: 'Lax', maxAge: 0 }));
};

const setMfaChallengeCookie = (res, token) => appendCookie(res, serializeCookie(mfaChallengeCookieName, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 5 * 60,
}));

const clearMfaChallengeCookie = (res) => appendCookie(res, serializeCookie(mfaChallengeCookieName, '', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  maxAge: 0,
}));

const getAdminRecord = async (adminId) => {
  if (isDbConnected) return Admin.findById(adminId);
  return memoryStore.adminCredentials;
};

const updateAdminRecord = async (adminId, changes) => {
  if (isDbConnected) {
    const admin = await Admin.findByIdAndUpdate(adminId, changes, { new: true, runValidators: true });
    if (!admin) throw new Error('Admin account not found.');
    Object.assign(memoryStore.adminCredentials, {
      username: admin.username,
      passwordHash: admin.password,
      tokenVersion: admin.tokenVersion || 0,
      mfaEnabled: Boolean(admin.mfaEnabled),
      mfaSecret: admin.mfaSecret,
      mfaPendingSecret: admin.mfaPendingSecret,
      mfaBackupCodes: admin.mfaBackupCodes || [],
      mfaLastUsedStep: admin.mfaLastUsedStep || -1,
    });
    return admin;
  }

  Object.assign(memoryStore.adminCredentials, changes);
  return memoryStore.adminCredentials;
};

const safeMfaStatus = (admin) => ({
  enabled: Boolean(admin?.mfaEnabled),
  recoveryCodesRemaining: (admin?.mfaBackupCodes || []).filter((code) => !code.usedAt).length,
});

const emptyMfaSecret = () => ({ iv: '', ciphertext: '', authTag: '' });

const hashBackupCodes = async (codes) => Promise.all(codes.map(async (code) => ({
  hash: await bcrypt.hash(code, 12),
  usedAt: null,
})));

const cleanProfile = (body = {}) => {
  const profile = {
    eyebrow: normalizeText(body.eyebrow, 120),
    title1: normalizeText(body.title1, 80),
    titleAccent: normalizeText(body.titleAccent, 80),
    title2: normalizeText(body.title2, 80),
    subtext: normalizeText(body.subtext, 500, { allowNewlines: true }),
    projectsShipped: normalizeText(body.projectsShipped, 30),
    yearsCoding: normalizeText(body.yearsCoding, 30),
    clientsServed: normalizeText(body.clientsServed, 30),
    status: normalizeText(body.status, 160),
    statusDetail: normalizeText(body.statusDetail, 500, { allowNewlines: true }),
    email: normalizeText(body.email, 254),
    pgpKey: normalizeUrl(body.pgpKey),
    linkedin: normalizeUrl(body.linkedin),
    leetcode: normalizeUrl(body.leetcode),
    twitter: normalizeUrl(body.twitter),
  };
  if (!isValidEmail(profile.email)) throw new Error('A valid public email is required.');
  return profile;
};

const cleanProject = (body = {}) => ({
  title: normalizeText(body.title, 140),
  tag: normalizeText(body.tag, 160),
  description: normalizeText(body.description, 800, { allowNewlines: true }),
  year: normalizeText(body.year, 30),
  link: normalizeUrl(body.link),
  iconText: normalizeText(body.iconText, 8),
  featured: Boolean(body.featured),
});

const cleanSkill = (body = {}) => ({
  name: normalizeText(body.name, 120),
  desc: normalizeText(body.desc, 300, { allowNewlines: true }),
  pips: Math.min(5, Math.max(1, Number(body.pips) || 1)),
  iconType: normalizeText(body.iconType, 40),
});

const cleanFocusArea = (body = {}) => ({
  tag: normalizeText(body.tag, 80),
  title: normalizeText(body.title, 140),
  desc: normalizeText(body.desc, 500, { allowNewlines: true }),
});

/** Convert Mongoose doc to plain object with string _id */
const toPlain = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

// ─── LOGIN / SESSION BOOTSTRAP ────────────────────────────────────────────────
router.get('/csrf', issueCsrfToken);

router.post('/login', requireCsrf, async (req, res) => {
  const username = normalizeText(req.body?.username, 80);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isDbConnected && !allowInMemoryFallback) {
    return res.status(503).json({ message: 'Admin login is unavailable until persistent storage is connected.' });
  }

  const loginKey = getLoginKey(req, username);
  try {
    const throttle = await getLoginThrottle(loginKey);
    if (throttle.blocked) {
      await recordAuditEvent({ event: 'login_failure', outcome: 'failure', req, details: 'rate_limited' });
      return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
    }

    let isValid = false;
    let authUserId = 'mem_admin_1';
    let authUsername = getAdminUsername();
    let authAdmin = memoryStore.adminCredentials;

    if (isDbConnected) {
      // Authenticate against MongoDB
      const admin = await Admin.findOne({ username });
      if (admin && (await admin.matchPassword(password))) {
        isValid = true;
        authUserId = String(admin._id);
        authUsername = admin.username;
        authAdmin = admin;
        // Keep memoryStore in sync on every successful login
        memoryStore.adminCredentials.username = admin.username;
        memoryStore.adminCredentials.passwordHash = admin.password;
      }
    } else {
      // Fall back to in-memory credentials
      const hash = getAdminPasswordHash();
      if (username === authUsername && (await bcrypt.compare(password, hash))) {
        isValid = true;
      }
    }

    if (isValid) {
      await clearLoginThrottle(loginKey);
      if (authAdmin.mfaEnabled) {
        const challenge = await createMfaChallenge(authUserId, authAdmin.tokenVersion || 0);
        setMfaChallengeCookie(res, challenge.token);
        await recordAuditEvent({ event: 'login_mfa_required', adminId: authUserId, req });
        return res.json({ mfaRequired: true, username: authUsername });
      }

      const csrfToken = parseCookies(req.headers.cookie)[csrfCookieName] || '';
      if (!csrfToken) return res.status(403).json({ message: 'CSRF bootstrap required.' });
      const session = await createSession({
        adminId: authUserId,
        tokenVersion: authAdmin.tokenVersion || 0,
        csrfToken,
        mfaVerified: true,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      setSessionCookies(res, session);
      await recordAuditEvent({ event: 'login_success', adminId: authUserId, req });
      return res.json({ username: authUsername });
    }

    const failure = await registerLoginFailure(loginKey);
    if (failure.blocked) {
      await recordAuditEvent({ event: 'login_failure', outcome: 'failure', req, details: 'rate_limited' });
      return res.status(429).json({
        message: 'Too many failed attempts. Try again later.',
      });
    }
    await recordAuditEvent({ event: 'login_failure', outcome: 'failure', req, details: 'invalid_credentials' });
    return res.status(401).json({ message: 'Invalid credentials.' });
  } catch (err) {
    await recordAuditEvent({ event: 'login_failure', outcome: 'failure', req, details: 'authentication_error' });
    res.status(500).json({ message: 'Authentication service unavailable.' });
  }
});

router.post('/mfa/verify-login', requireCsrf, async (req, res) => {
  if (!isDbConnected && !allowInMemoryFallback) {
    return res.status(503).json({ message: 'Admin login is unavailable until persistent storage is connected.' });
  }

  try {
    const challengeToken = parseCookies(req.headers.cookie)[mfaChallengeCookieName];
    const challenge = await consumeMfaChallenge(challengeToken);
    if (!challenge) {
      await recordAuditEvent({ event: 'mfa_failure', outcome: 'failure', req, details: 'challenge_expired' });
      return res.status(401).json({ message: 'MFA challenge expired. Start login again.' });
    }

    const admin = await getAdminRecord(challenge.adminId);
    if (!admin?.mfaEnabled || !admin.mfaSecret || challenge.tokenVersion !== (admin.tokenVersion || 0)) {
      await destroyMfaChallenge(challengeToken);
      clearMfaChallengeCookie(res);
      return res.status(401).json({ message: 'MFA is not configured for this account.' });
    }

    const code = normalizeText(req.body?.code, 32);
    let valid = false;
    let timeStep = null;
    let backupHash = '';
    const secret = decryptSecret(admin.mfaSecret);
    const totp = await verifyTotp(secret, code, admin.mfaLastUsedStep || -1);
    if (totp.valid) {
      valid = true;
      timeStep = totp.timeStep;
    } else {
      const normalizedBackupCode = normalizeBackupCode(code);
      for (const backupCode of /^[A-F0-9]{10}$/.test(normalizedBackupCode) ? admin.mfaBackupCodes || [] : []) {
        if (backupCode.usedAt || !await bcrypt.compare(normalizedBackupCode, backupCode.hash)) continue;
        backupHash = backupCode.hash;
        valid = true;
        break;
      }
    }

    if (!valid) {
      await recordAuditEvent({ event: 'mfa_failure', outcome: 'failure', adminId: challenge.adminId, req, details: 'invalid_code' });
      return res.status(401).json({ message: 'Invalid MFA code.' });
    }

    if (!await redeemMfaChallenge(challengeToken) || !await claimMfaProof({
      adminId: challenge.adminId,
      tokenVersion: challenge.tokenVersion,
      secretCiphertext: admin.mfaSecret.ciphertext,
      timeStep,
      backupHash,
    })) {
      await recordAuditEvent({ event: 'mfa_failure', outcome: 'failure', adminId: challenge.adminId, req, details: 'proof_already_used_or_revoked' });
      return res.status(401).json({ message: 'MFA verification expired or was already used. Start login again.' });
    }
    clearMfaChallengeCookie(res);
    const csrfToken = parseCookies(req.headers.cookie)[csrfCookieName] || '';
    if (!csrfToken) return res.status(403).json({ message: 'CSRF bootstrap required.' });
    const session = await createSession({
      adminId: challenge.adminId,
      tokenVersion: challenge.tokenVersion,
      csrfToken,
      mfaVerified: true,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setSessionCookies(res, session);
    await recordAuditEvent({ event: 'mfa_success', adminId: challenge.adminId, req });
    return res.json({ username: admin.username });
  } catch (error) {
    await recordAuditEvent({ event: 'mfa_failure', outcome: 'failure', req, details: 'verification_error' });
    console.error('MFA verification failed:', error.message);
    return res.status(401).json({ message: 'MFA verification failed.' });
  }
});

// ─── AUTHENTICATED ADMIN ROUTES ───────────────────────────────────────────────
router.post('/logout', protect, requireCsrf, async (req, res) => {
  await recordAuditEvent({ event: 'logout', adminId: req.user.id, req });
  await destroySession(req.sessionToken);
  clearSessionCookies(res);
  res.json({ message: 'Logged out.' });
});

router.use(protect);
router.use(requireCsrf);

router.get('/me', (req, res) => {
  res.json({ status: 'authenticated', user: req.user });
});

// ─── SECURITY CENTER ──────────────────────────────────────────────────────────
router.get('/security/sessions', async (req, res) => {
  try {
    const sessions = await listAdminSessions(req.user.id);
    return res.json({
      sessions: sessions.map((session) => ({
        id: String(session._id),
        current: String(session._id) === req.sessionId,
        ip: session.ip || 'Unknown',
        userAgent: session.userAgent || 'Unknown device',
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt || session.updatedAt || session.createdAt,
        expiresAt: session.expiresAt,
        mfaVerified: Boolean(session.mfaVerified),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load active sessions.' });
  }
});

router.delete('/security/sessions/:id', async (req, res) => {
  try {
    const revoked = await revokeAdminSession(req.user.id, req.params.id);
    if (!revoked) return res.status(404).json({ message: 'Session not found.' });
    const isCurrent = req.params.id === req.sessionId;
    await recordAuditEvent({ event: 'session_revoked', adminId: req.user.id, req, details: isCurrent ? 'current_session' : 'single_session' });
    if (isCurrent) {
      clearSessionCookies(res);
      return res.json({ message: 'Current session revoked.', current: true });
    }
    return res.json({ message: 'Session revoked.', current: false });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid session identifier.' });
  }
});

router.post('/security/sessions/revoke-others', async (req, res) => {
  try {
    const count = await revokeOtherAdminSessions(req.user.id, req.sessionId);
    await recordAuditEvent({ event: 'sessions_revoked', adminId: req.user.id, req, details: `${count} other session(s)` });
    return res.json({ message: `${count} other session(s) revoked.`, count });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to revoke other sessions.' });
  }
});

router.get('/security/audit', async (req, res) => {
  try {
    return res.json({
      ...await listAuditEvents({
        page: req.query.page,
        limit: req.query.limit,
        event: req.query.event,
        outcome: req.query.outcome,
        from: req.query.from,
        to: req.query.to,
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load the audit log.' });
  }
});

router.get('/mfa/status', async (req, res) => {
  const admin = await getAdminRecord(req.user.id);
  res.json(safeMfaStatus(admin));
});

router.post('/mfa/setup', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const admin = await getAdminRecord(req.user.id);
    if (admin.mfaEnabled) return res.status(400).json({ message: 'MFA is already enabled.' });

    const setup = createTotpSetup(admin.username || getAdminUsername());
    const encrypted = encryptSecret(setup.secret);
    await updateAdminRecord(req.user.id, {
      mfaPendingSecret: { ...encrypted, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    return res.json({
      qrCodeDataUrl: await toDataURL(setup.uri, { errorCorrectionLevel: 'M' }),
      manualKey: setup.secret,
      expiresInSeconds: 600,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/mfa/confirm', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const admin = await getAdminRecord(req.user.id);
    const pending = admin.mfaPendingSecret;
    if (!pending?.expiresAt || new Date(pending.expiresAt) <= new Date()) {
      return res.status(400).json({ message: 'MFA setup has expired. Start setup again.' });
    }

    const secret = decryptSecret(pending);
    const result = await verifyTotp(secret, req.body?.code, -1);
    if (!result.valid) return res.status(400).json({ message: 'Invalid authenticator code.' });

    const backupCodes = generateBackupCodes();
    await updateAdminRecord(req.user.id, {
      mfaEnabled: true,
      mfaSecret: { iv: pending.iv, ciphertext: pending.ciphertext, authTag: pending.authTag },
      mfaPendingSecret: emptyMfaSecret(),
      mfaBackupCodes: await hashBackupCodes(backupCodes),
      // Setup confirmation is not a login authentication event. Do not burn
      // the current time step before the user's first MFA login.
      mfaLastUsedStep: -1,
      tokenVersion: (admin.tokenVersion || memoryStore.adminCredentials.tokenVersion || 0) + 1,
    });
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);
    await recordAuditEvent({ event: 'mfa_enabled', adminId: req.user.id, req });
    return res.json({ backupCodes });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/mfa/disable', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const admin = await getAdminRecord(req.user.id);
    if (!admin.mfaEnabled) return res.status(400).json({ message: 'MFA is not enabled.' });
    const password = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    if (!await bcrypt.compare(password, admin.password || admin.passwordHash || '')) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const result = await verifyTotp(decryptSecret(admin.mfaSecret), req.body?.code, admin.mfaLastUsedStep || -1);
    if (!result.valid) return res.status(400).json({ message: 'Invalid authenticator code.' });
    if (!await claimMfaProof({ adminId: req.user.id, tokenVersion: admin.tokenVersion || 0, secretCiphertext: admin.mfaSecret.ciphertext, timeStep: result.timeStep })) {
      return res.status(400).json({ message: 'Authenticator code was already used. Wait for a new code.' });
    }

    await updateAdminRecord(req.user.id, {
      mfaEnabled: false,
      mfaSecret: emptyMfaSecret(),
      mfaPendingSecret: emptyMfaSecret(),
      mfaBackupCodes: [],
      mfaLastUsedStep: -1,
      tokenVersion: (admin.tokenVersion || memoryStore.adminCredentials.tokenVersion || 0) + 1,
    });
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);
    await recordAuditEvent({ event: 'mfa_disabled', adminId: req.user.id, req });
    return res.json({ message: 'MFA disabled. Sign in again.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/mfa/regenerate-backup-codes', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const admin = await getAdminRecord(req.user.id);
    if (!admin.mfaEnabled) return res.status(400).json({ message: 'Enable MFA before generating recovery codes.' });
    const result = await verifyTotp(decryptSecret(admin.mfaSecret), req.body?.code, admin.mfaLastUsedStep || -1);
    if (!result.valid) return res.status(400).json({ message: 'Invalid authenticator code.' });
    if (!await claimMfaProof({ adminId: req.user.id, tokenVersion: admin.tokenVersion || 0, secretCiphertext: admin.mfaSecret.ciphertext, timeStep: result.timeStep })) {
      return res.status(400).json({ message: 'Authenticator code was already used. Wait for a new code.' });
    }
    const backupCodes = generateBackupCodes();
    await updateAdminRecord(req.user.id, {
      mfaBackupCodes: await hashBackupCodes(backupCodes),
      mfaLastUsedStep: result.timeStep,
    });
    await recordAuditEvent({ event: 'recovery_codes_regenerated', adminId: req.user.id, req });
    return res.json({ backupCodes });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    persistence: isDbConnected ? 'durable' : 'memory-only',
    warning: isDbConnected ? '' : 'Changes will be lost when the server restarts.',
  });
});

// ─── CHANGE USERNAME ──────────────────────────────────────────────────────────
router.put('/change-username', async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newUsername = normalizeText(req.body?.newUsername, 80);

  if (!requireAdminStorage(res)) return;
  if (!currentPassword || newUsername.length < 3) {
    return res.status(400).json({ message: 'Current password and new username (min 3 chars) required.' });
  }

  try {
    // Verify current password
    const admin = await getAdminRecord(req.user.id);
    if (!admin) return res.status(401).json({ message: 'Admin account is unavailable.' });
    const hash = admin.password || admin.passwordHash || '';
    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    const trimmed = newUsername;

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      admin.username = trimmed;
      admin.tokenVersion = (admin.tokenVersion || 0) + 1;
      await admin.save();
      memoryStore.adminCredentials.tokenVersion = admin.tokenVersion;
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.username = trimmed;
    if (!isDbConnected) memoryStore.adminCredentials.tokenVersion += 1;
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);

    await recordAuditEvent({ event: 'username_changed', adminId: req.user.id, req });

    return res.json({ message: 'Username updated successfully!', username: trimmed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
router.put('/change-password', async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!requireAdminStorage(res)) return;
  if (!currentPassword || newPassword.length < 12 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    return res.status(400).json({ message: 'Current password and a new password of at least 12 characters and at most 72 UTF-8 bytes are required.' });
  }

  try {
    // Verify current password
    const admin = await getAdminRecord(req.user.id);
    if (!admin) return res.status(401).json({ message: 'Admin account is unavailable.' });
    const hash = admin.password || admin.passwordHash || '';
    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    // Hash new password ONCE
    const newHash = await bcrypt.hash(newPassword, 10);

    // 1. Save to MongoDB (permanent) — store pre-hashed value, Admin pre-save hook skips re-hash
    if (isDbConnected) {
      admin.password = newHash;
      admin.tokenVersion = (admin.tokenVersion || 0) + 1;
      await admin.save();
      memoryStore.adminCredentials.tokenVersion = admin.tokenVersion;
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.passwordHash = newHash;
    if (!isDbConnected) memoryStore.adminCredentials.tokenVersion += 1;
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);

    await recordAuditEvent({ event: 'password_changed', adminId: req.user.id, req });

    return res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanProfile(req.body);
    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      let profile = await Profile.findOne();
      if (profile) {
        Object.assign(profile, changes);
        await profile.save();
      } else {
        await Profile.create(changes);
      }
    }

    // 2. Update in-memory cache
    Object.assign(memoryStore.profile, changes);

    res.json(memoryStore.profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  if (isDbConnected) {
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: 1 });
    if (projects.length > 0) {
      memoryStore.projects = projects.map(toPlain);
      return res.json(memoryStore.projects);
    }
  }
  res.json(memoryStore.projects);
});

router.post('/projects', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanProject(req.body);
    let saved;

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      const doc = await Project.create(changes);
      saved = toPlain(doc);
    } else {
      saved = { _id: `memory_project_${Date.now()}`, ...changes };
    }

    // 2. Update in-memory cache
    memoryStore.projects.unshift(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/projects/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanProject(req.body);
    let updated;

    if (isDbConnected) {
      const doc = await Project.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Project not found.' });
      updated = toPlain(doc);
    }

    // Always update in-memory cache
    const idx = memoryStore.projects.findIndex((p) => String(p._id) === req.params.id);
    if (idx !== -1) {
      memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...changes };
      if (!updated) updated = memoryStore.projects[idx];
    }

    if (!updated) return res.status(404).json({ message: 'Project not found.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    if (isDbConnected) {
      const deleted = await Project.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Project not found.' });
    }
    const count = memoryStore.projects.length;
    memoryStore.projects = memoryStore.projects.filter((p) => String(p._id) !== req.params.id);
    if (!isDbConnected && memoryStore.projects.length === count) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── SKILLS ───────────────────────────────────────────────────────────────────
router.get('/skills', async (req, res) => {
  if (isDbConnected) {
    const skills = await Skill.find().sort({ createdAt: 1 });
    if (skills.length > 0) {
      memoryStore.skills = skills.map(toPlain);
      return res.json(memoryStore.skills);
    }
  }
  res.json(memoryStore.skills);
});

router.post('/skills', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanSkill(req.body);
    let saved;

    if (isDbConnected) {
      const doc = await Skill.create(changes);
      saved = toPlain(doc);
    } else {
      saved = { _id: `memory_skill_${Date.now()}`, ...changes };
    }

    memoryStore.skills.push(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/skills/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanSkill(req.body);
    let updated;

    if (isDbConnected) {
      const doc = await Skill.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Skill not found.' });
      updated = toPlain(doc);
    }

    const idx = memoryStore.skills.findIndex((s) => String(s._id) === req.params.id);
    if (idx !== -1) {
      memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...changes };
      if (!updated) updated = memoryStore.skills[idx];
    }

    if (!updated) return res.status(404).json({ message: 'Skill not found.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/skills/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    if (isDbConnected) {
      const deleted = await Skill.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Skill not found.' });
    }
    const count = memoryStore.skills.length;
    memoryStore.skills = memoryStore.skills.filter((s) => String(s._id) !== req.params.id);
    if (!isDbConnected && memoryStore.skills.length === count) return res.status(404).json({ message: 'Skill not found.' });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── FOCUS AREAS ──────────────────────────────────────────────────────────────
router.get('/focus-areas', async (req, res) => {
  if (isDbConnected) {
    const areas = await FocusArea.find().sort({ sortOrder: 1, createdAt: 1 });
    if (areas.length > 0) {
      memoryStore.focusAreas = areas.map(toPlain);
      return res.json(memoryStore.focusAreas);
    }
  }
  res.json(memoryStore.focusAreas);
});

router.post('/focus-areas', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanFocusArea(req.body);
    let saved;

    if (isDbConnected) {
      const doc = await FocusArea.create({ ...changes, sortOrder: memoryStore.focusAreas.length });
      saved = toPlain(doc);
    } else {
      saved = { _id: `memory_focus_${Date.now()}`, ...changes, sortOrder: memoryStore.focusAreas.length };
    }

    memoryStore.focusAreas.push(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/focus-areas/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    const changes = cleanFocusArea(req.body);
    let updated;

    if (isDbConnected) {
      const doc = await FocusArea.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Focus area not found.' });
      updated = toPlain(doc);
    }

    const idx = memoryStore.focusAreas.findIndex((f) => String(f._id) === req.params.id);
    if (idx !== -1) {
      memoryStore.focusAreas[idx] = { ...memoryStore.focusAreas[idx], ...changes };
      if (!updated) updated = memoryStore.focusAreas[idx];
    }

    if (!updated) return res.status(404).json({ message: 'Focus area not found.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/focus-areas/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    if (isDbConnected) {
      const deleted = await FocusArea.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Focus area not found.' });
    }
    const count = memoryStore.focusAreas.length;
    memoryStore.focusAreas = memoryStore.focusAreas.filter((f) => String(f._id) !== req.params.id);
    if (!isDbConnected && memoryStore.focusAreas.length === count) return res.status(404).json({ message: 'Focus area not found.' });
    res.json({ message: 'Focus area deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
router.get('/messages', async (req, res) => {
  if (isDbConnected) {
    const messages = await Message.find().sort({ createdAt: -1 });
    return res.json(messages);
  }
  res.json(memoryStore.messages);
});

router.delete('/messages/:id', async (req, res) => {
  if (!requireAdminStorage(res)) return;
  try {
    if (isDbConnected) {
      const deleted = await Message.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Message not found.' });
    }
    const count = memoryStore.messages.length;
    memoryStore.messages = memoryStore.messages.filter((m) => m._id !== req.params.id);
    if (!isDbConnected && memoryStore.messages.length === count) return res.status(404).json({ message: 'Message not found.' });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
