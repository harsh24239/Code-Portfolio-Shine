import express from 'express';
import bcrypt from 'bcryptjs';
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
import { createSession, destroyAdminSessions, destroySession } from '../store/sessionStore.js';
import { appendCookie, parseCookies, serializeCookie } from '../utils/cookies.js';
import { isValidEmail, normalizeText, normalizeUrl } from '../utils/validation.js';

const router = express.Router();

const failedLogins = new Map();

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
  const lockout = failedLogins.get(loginKey);
  const activeLockout = lockout && Date.now() < lockout.expiresAt ? lockout : null;
  if (activeLockout) {
    return res.status(429).json({ message: 'Too many failed attempts. Try again later.' });
  }
  if (lockout) failedLogins.delete(loginKey);

  try {
    let isValid = false;
    let authUserId = 'mem_admin_1';
    let authUsername = getAdminUsername();

    if (isDbConnected) {
      // Authenticate against MongoDB
      const admin = await Admin.findOne({ username });
      if (admin && (await admin.matchPassword(password))) {
        isValid = true;
        authUserId = String(admin._id);
        authUsername = admin.username;
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
      failedLogins.delete(loginKey);
      await destroyAdminSessions(authUserId);
      const csrfToken = parseCookies(req.headers.cookie)[csrfCookieName] || '';
      if (!csrfToken) return res.status(403).json({ message: 'CSRF bootstrap required.' });
      const session = await createSession({
        adminId: authUserId,
        tokenVersion: memoryStore.adminCredentials.tokenVersion || 0,
        csrfToken,
      });
      setSessionCookies(res, session);
      return res.json({ username: authUsername });
    }

    const attempts = (activeLockout?.attempts || 0) + 1;
    if (attempts >= 5) {
      failedLogins.set(loginKey, { attempts, expiresAt: Date.now() + 15 * 60 * 1000 });
      return res.status(429).json({
        message: 'Too many failed attempts. Try again later.',
      });
    }
    failedLogins.set(loginKey, { attempts, expiresAt: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ message: 'Invalid credentials.' });
  } catch (err) {
    res.status(500).json({ message: 'Authentication service unavailable.' });
  }
});

// ─── AUTHENTICATED ADMIN ROUTES ───────────────────────────────────────────────
router.post('/logout', protect, requireCsrf, async (req, res) => {
  await destroySession(req.sessionToken);
  clearSessionCookies(res);
  res.json({ message: 'Logged out.' });
});

router.use(protect);
router.use(requireCsrf);

router.get('/me', (req, res) => {
  res.json({ status: 'authenticated', user: req.user });
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
    const hash = getAdminPasswordHash();
    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    const trimmed = newUsername;

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      const admin = await Admin.findOne();
      if (admin) {
        admin.username = trimmed;
        admin.tokenVersion = (admin.tokenVersion || 0) + 1;
        await admin.save();
        memoryStore.adminCredentials.tokenVersion = admin.tokenVersion;
      }
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.username = trimmed;
    if (!isDbConnected) memoryStore.adminCredentials.tokenVersion += 1;
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);

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
  if (!currentPassword || newPassword.length < 12) {
    return res.status(400).json({ message: 'Current password and new password (min 12 chars) required.' });
  }

  try {
    // Verify current password
    const hash = getAdminPasswordHash();
    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    // Hash new password ONCE
    const newHash = await bcrypt.hash(newPassword, 10);

    // 1. Save to MongoDB (permanent) — store pre-hashed value, Admin pre-save hook skips re-hash
    if (isDbConnected) {
      const admin = await Admin.findOne();
      if (admin) {
        admin.password = newHash; // already hashed — hook skips because starts with '$2'
        admin.tokenVersion = (admin.tokenVersion || 0) + 1;
        await admin.save();
        memoryStore.adminCredentials.tokenVersion = admin.tokenVersion;
      }
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.passwordHash = newHash;
    if (!isDbConnected) memoryStore.adminCredentials.tokenVersion += 1;
    await destroyAdminSessions(req.user.id);
    clearSessionCookies(res);

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
