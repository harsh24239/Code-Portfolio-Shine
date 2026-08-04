import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { Admin } from '../models/Admin.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { FocusArea } from '../models/FocusArea.js';
import { Message } from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

let failedLoginCount = 0;
let lockoutExpiryTime = 0;

// ─── Credential Helpers ───────────────────────────────────────────────────────
// Always read from memoryStore (synced from MongoDB on startup)
const getAdminUsername = () =>
  memoryStore.adminCredentials?.username || process.env.ADMIN_USERNAME || 'admin';

const getAdminPasswordHash = () => {
  if (!memoryStore.adminCredentials?.passwordHash) {
    // Safety fallback — should never happen after startup sync
    memoryStore.adminCredentials.passwordHash = bcrypt.hashSync(
      process.env.ADMIN_PASSWORD || 'admin123',
      10
    );
  }
  return memoryStore.adminCredentials.passwordHash;
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', { expiresIn: '12h' });

/** Convert Mongoose doc to plain object with string _id */
const toPlain = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (Date.now() < lockoutExpiryTime) {
    const minsLeft = Math.ceil((lockoutExpiryTime - Date.now()) / 60000);
    return res.status(429).json({
      message: `SECURITY LOCKOUT: Account locked. Try again in ${minsLeft} minute(s).`,
    });
  }

  try {
    let isValid = false;
    let authUserId = 'mem_admin_1';
    let authUsername = getAdminUsername();

    if (isDbConnected) {
      // Authenticate against MongoDB
      const admin = await Admin.findOne({ username });
      if (admin && (await admin.matchPassword(password))) {
        isValid = true;
        authUserId = admin._id;
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
      failedLoginCount = 0;
      lockoutExpiryTime = 0;
      return res.json({ token: generateToken(authUserId), username: authUsername });
    }

    failedLoginCount += 1;
    if (failedLoginCount >= 5) {
      lockoutExpiryTime = Date.now() + 15 * 60 * 1000;
      return res.status(429).json({
        message: 'SECURITY ALERT: 5 failed attempts. Account locked for 15 minutes.',
      });
    }
    return res.status(401).json({
      message: `Invalid credentials. ${5 - failedLoginCount} attempt(s) remaining before lockout.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ME ───────────────────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ status: 'authenticated', user: req.user });
});

// ─── CHANGE USERNAME ──────────────────────────────────────────────────────────
router.put('/change-username', protect, async (req, res) => {
  const { currentPassword, newUsername } = req.body;

  if (!currentPassword || !newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({ message: 'Current password and new username (min 3 chars) required.' });
  }

  try {
    // Verify current password
    const hash = getAdminPasswordHash();
    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    const trimmed = newUsername.trim();

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      const admin = await Admin.findOne();
      if (admin) {
        admin.username = trimmed;
        await admin.save();
      }
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.username = trimmed;

    return res.json({ message: 'Username updated successfully!', username: trimmed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Current password and new password (min 6 chars) required.' });
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
        await admin.save();
      }
    }

    // 2. Update in-memory cache
    memoryStore.adminCredentials.passwordHash = newHash;

    return res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      let profile = await Profile.findOne();
      if (profile) {
        Object.assign(profile, req.body);
        await profile.save();
      } else {
        profile = await Profile.create(req.body);
      }
    }

    // 2. Update in-memory cache
    Object.assign(memoryStore.profile, req.body);

    res.json(memoryStore.profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
router.get('/projects', protect, async (req, res) => {
  if (isDbConnected) {
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: 1 });
    if (projects.length > 0) {
      memoryStore.projects = projects.map(toPlain);
      return res.json(memoryStore.projects);
    }
  }
  res.json(memoryStore.projects);
});

router.post('/projects', protect, async (req, res) => {
  try {
    let saved;

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      const doc = await Project.create(req.body);
      saved = toPlain(doc);
    } else {
      saved = { _id: String(Date.now()), ...req.body };
    }

    // 2. Update in-memory cache
    memoryStore.projects.unshift(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/projects/:id', protect, async (req, res) => {
  try {
    let updated;

    // 1. Save to MongoDB (permanent)
    if (isDbConnected) {
      const doc = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (doc) updated = toPlain(doc);
    }

    // 2. Update in-memory cache
    const idx = memoryStore.projects.findIndex((p) => p._id === req.params.id);
    if (idx !== -1) {
      memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...req.body };
      if (!updated) updated = memoryStore.projects[idx];
    }

    res.json(updated || req.body);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/projects/:id', protect, async (req, res) => {
  try {
    // 1. Delete from MongoDB (permanent)
    if (isDbConnected) {
      await Project.findByIdAndDelete(req.params.id);
    }

    // 2. Update in-memory cache
    memoryStore.projects = memoryStore.projects.filter((p) => p._id !== req.params.id);

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── SKILLS ───────────────────────────────────────────────────────────────────
router.get('/skills', protect, async (req, res) => {
  if (isDbConnected) {
    const skills = await Skill.find().sort({ createdAt: 1 });
    if (skills.length > 0) {
      memoryStore.skills = skills.map(toPlain);
      return res.json(memoryStore.skills);
    }
  }
  res.json(memoryStore.skills);
});

router.post('/skills', protect, async (req, res) => {
  try {
    let saved;

    if (isDbConnected) {
      const doc = await Skill.create(req.body);
      saved = toPlain(doc);
    } else {
      saved = { _id: String(Date.now()), ...req.body };
    }

    memoryStore.skills.push(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/skills/:id', protect, async (req, res) => {
  try {
    let updated;

    if (isDbConnected) {
      const doc = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (doc) updated = toPlain(doc);
    }

    const idx = memoryStore.skills.findIndex((s) => s._id === req.params.id);
    if (idx !== -1) {
      memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...req.body };
      if (!updated) updated = memoryStore.skills[idx];
    }

    res.json(updated || req.body);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/skills/:id', protect, async (req, res) => {
  try {
    if (isDbConnected) {
      await Skill.findByIdAndDelete(req.params.id);
    }
    memoryStore.skills = memoryStore.skills.filter((s) => s._id !== req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── FOCUS AREAS ──────────────────────────────────────────────────────────────
router.get('/focus-areas', protect, async (req, res) => {
  if (isDbConnected) {
    const areas = await FocusArea.find().sort({ sortOrder: 1, createdAt: 1 });
    if (areas.length > 0) {
      memoryStore.focusAreas = areas.map(toPlain);
      return res.json(memoryStore.focusAreas);
    }
  }
  res.json(memoryStore.focusAreas);
});

router.post('/focus-areas', protect, async (req, res) => {
  try {
    let saved;

    if (isDbConnected) {
      const doc = await FocusArea.create({ ...req.body, sortOrder: memoryStore.focusAreas.length });
      saved = toPlain(doc);
    } else {
      saved = { _id: String(Date.now()), ...req.body };
    }

    memoryStore.focusAreas.push(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/focus-areas/:id', protect, async (req, res) => {
  try {
    let updated;

    if (isDbConnected) {
      const doc = await FocusArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (doc) updated = toPlain(doc);
    }

    const idx = memoryStore.focusAreas.findIndex((f) => f._id === req.params.id);
    if (idx !== -1) {
      memoryStore.focusAreas[idx] = { ...memoryStore.focusAreas[idx], ...req.body };
      if (!updated) updated = memoryStore.focusAreas[idx];
    }

    res.json(updated || req.body);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/focus-areas/:id', protect, async (req, res) => {
  try {
    if (isDbConnected) {
      await FocusArea.findByIdAndDelete(req.params.id);
    }
    memoryStore.focusAreas = memoryStore.focusAreas.filter((f) => f._id !== req.params.id);
    res.json({ message: 'Focus area deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
router.get('/messages', protect, async (req, res) => {
  if (isDbConnected) {
    const messages = await Message.find().sort({ createdAt: -1 });
    return res.json(messages);
  }
  res.json(memoryStore.messages);
});

router.delete('/messages/:id', protect, async (req, res) => {
  try {
    if (isDbConnected) {
      await Message.findByIdAndDelete(req.params.id);
    }
    memoryStore.messages = memoryStore.messages.filter((m) => m._id !== req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
