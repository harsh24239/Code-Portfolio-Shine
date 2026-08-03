import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isDbConnected } from '../config/db.js';
import { memoryStore, persistMemoryStore } from '../store/memoryStore.js';
import { Admin } from '../models/Admin.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Message } from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import { sendPasswordResetOTP } from '../config/email.js';

const router = express.Router();

let memoryAdminUsername = process.env.ADMIN_USERNAME || 'admin';
let memoryAdminPasswordHash = null;
let activeOtpStore = { code: null, expiresAt: 0 };

let failedLoginCount = 0;
let lockoutExpiryTime = 0;

const getMemoryAdminUsername = () => {
  return memoryStore.adminCredentials?.username || process.env.ADMIN_USERNAME || 'admin';
};

const getMemoryAdminPasswordHash = async () => {
  if (!memoryStore.adminCredentials?.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
    memoryStore.adminCredentials.passwordHash = await bcrypt.hash(defaultPass, salt);
    persistMemoryStore();
  }
  return memoryStore.adminCredentials.passwordHash;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
    expiresIn: '12h',
  });
};

// POST /api/admin/login (With 15-Minute Lockout after 5 Failed Attempts)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check 15-minute Lockout
  if (Date.now() < lockoutExpiryTime) {
    const msRemaining = lockoutExpiryTime - Date.now();
    const minsLeft = Math.ceil(msRemaining / (1000 * 60));
    return res.status(429).json({
      message: `SECURITY LOCKOUT ACTIVE: 5 failed password attempts reached. Account locked. Try again in ${minsLeft} minutes.`,
    });
  }

  try {
    let isValid = false;
    let authUserId = 'mem_admin_1';
    let currentMemUser = getMemoryAdminUsername();
    let authUsername = currentMemUser;

    if (!isDbConnected) {
      const hash = await getMemoryAdminPasswordHash();
      const isMatch = await bcrypt.compare(password, hash);
      if (username === currentMemUser && isMatch) {
        isValid = true;
      }
    } else {
      const admin = await Admin.findOne({ username });
      if (admin && (await admin.matchPassword(password))) {
        isValid = true;
        authUserId = admin._id;
        authUsername = admin.username;
      }
    }

    if (isValid) {
      failedLoginCount = 0;
      lockoutExpiryTime = 0;
      return res.json({
        token: generateToken(authUserId),
        username: authUsername,
      });
    } else {
      failedLoginCount += 1;
      if (failedLoginCount >= 5) {
        lockoutExpiryTime = Date.now() + 15 * 60 * 1000; // 15 Minutes Lockout
        return res.status(429).json({
          message: 'SECURITY ALERT: 5 consecutive failed password attempts. Account is locked for 15 minutes.',
        });
      }
      const attemptsLeft = 5 - failedLoginCount;
      return res.status(401).json({
        message: `Invalid username or password. Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before 15-minute lockout.`,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/me
router.get('/me', protect, async (req, res) => {
  res.json({ status: 'authenticated', user: req.user });
});

// PUT /api/admin/change-username (Requires currentPassword verification)
router.put('/change-username', protect, async (req, res) => {
  const { currentPassword, newUsername } = req.body;

  if (!currentPassword || !newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({ message: 'Current password and new username (min 3 chars) required.' });
  }

  try {
    const hash = await getMemoryAdminPasswordHash();
    let isMatch = false;

    if (!isDbConnected) {
      isMatch = await bcrypt.compare(currentPassword, hash);
    } else {
      const admin = await Admin.findOne();
      if (admin) {
        isMatch = await admin.matchPassword(currentPassword);
        if (isMatch) {
          admin.username = newUsername.trim();
          await admin.save();
        }
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    // Always persist to memoryStore & user_data.json
    memoryStore.adminCredentials.username = newUsername.trim();
    persistMemoryStore();

    return res.json({ message: 'Username updated successfully!', username: newUsername.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/change-password (Requires currentPassword verification)
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Current password and new password (min 6 chars) required.' });
  }

  try {
    const hash = await getMemoryAdminPasswordHash();
    let isMatch = false;

    if (!isDbConnected) {
      isMatch = await bcrypt.compare(currentPassword, hash);
    } else {
      const admin = await Admin.findOne();
      if (admin) {
        isMatch = await admin.matchPassword(currentPassword);
        if (isMatch) {
          admin.password = newPassword;
          await admin.save();
        }
      }
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }

    // Hash and persist to memoryStore & user_data.json
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    memoryStore.adminCredentials.passwordHash = newHash;
    persistMemoryStore();

    return res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- PROFILE ---
router.put('/profile', protect, async (req, res) => {
  try {
    Object.assign(memoryStore.profile, req.body);
    persistMemoryStore();

    if (isDbConnected) {
      let profile = await Profile.findOne();
      if (profile) {
        Object.assign(profile, req.body);
        await profile.save();
      } else {
        await Profile.create(req.body);
      }
    }
    res.json(memoryStore.profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- PROJECTS ---
router.get('/projects', protect, async (req, res) => {
  if (!isDbConnected) return res.json(memoryStore.projects);
  const projects = await Project.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json(projects.length > 0 ? projects : memoryStore.projects);
});

router.post('/projects', protect, async (req, res) => {
  try {
    const newProj = { _id: String(Date.now()), ...req.body };
    memoryStore.projects.unshift(newProj);
    persistMemoryStore();

    if (isDbConnected) {
      await Project.create(req.body);
    }
    res.status(201).json(newProj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/projects/:id', protect, async (req, res) => {
  try {
    const idx = memoryStore.projects.findIndex((p) => p._id === req.params.id);
    if (idx !== -1) {
      memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...req.body };
      persistMemoryStore();
    }

    if (isDbConnected) {
      await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }
    res.json(memoryStore.projects[idx] || req.body);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/projects/:id', protect, async (req, res) => {
  try {
    memoryStore.projects = memoryStore.projects.filter((p) => p._id !== req.params.id);
    persistMemoryStore();

    if (isDbConnected) {
      await Project.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- SKILLS ---
router.get('/skills', protect, async (req, res) => {
  if (!isDbConnected) return res.json(memoryStore.skills);
  const skills = await Skill.find().sort({ createdAt: 1 });
  res.json(skills.length > 0 ? skills : memoryStore.skills);
});

router.post('/skills', protect, async (req, res) => {
  try {
    const newSkill = { _id: String(Date.now()), ...req.body };
    memoryStore.skills.push(newSkill);
    persistMemoryStore();

    if (isDbConnected) {
      await Skill.create(req.body);
    }
    res.status(201).json(newSkill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/skills/:id', protect, async (req, res) => {
  try {
    const idx = memoryStore.skills.findIndex((s) => s._id === req.params.id);
    if (idx !== -1) {
      memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...req.body };
      persistMemoryStore();
    }

    if (isDbConnected) {
      await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    }
    res.json(memoryStore.skills[idx] || req.body);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/skills/:id', protect, async (req, res) => {
  try {
    memoryStore.skills = memoryStore.skills.filter((s) => s._id !== req.params.id);
    persistMemoryStore();

    if (isDbConnected) {
      await Skill.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- FOCUS AREAS ---
router.get('/focus-areas', protect, async (req, res) => {
  if (!isDbConnected) return res.json(memoryStore.focusAreas);
  res.json(memoryStore.focusAreas);
});

router.post('/focus-areas', protect, async (req, res) => {
  try {
    const newArea = { _id: String(Date.now()), ...req.body };
    memoryStore.focusAreas.push(newArea);
    persistMemoryStore();
    return res.status(201).json(newArea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/focus-areas/:id', protect, async (req, res) => {
  try {
    const idx = memoryStore.focusAreas.findIndex((f) => f._id === req.params.id);
    if (idx !== -1) {
      memoryStore.focusAreas[idx] = { ...memoryStore.focusAreas[idx], ...req.body };
      persistMemoryStore();
      return res.json(memoryStore.focusAreas[idx]);
    }
    res.status(404).json({ message: 'Focus area not found' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/focus-areas/:id', protect, async (req, res) => {
  try {
    memoryStore.focusAreas = memoryStore.focusAreas.filter((f) => f._id !== req.params.id);
    persistMemoryStore();
    return res.json({ message: 'Focus area deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- MESSAGES INBOX ---
router.get('/messages', protect, async (req, res) => {
  if (!isDbConnected) return res.json(memoryStore.messages);
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

router.delete('/messages/:id', protect, async (req, res) => {
  try {
    memoryStore.messages = memoryStore.messages.filter((m) => m._id !== req.params.id);
    persistMemoryStore();

    if (isDbConnected) {
      await Message.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

