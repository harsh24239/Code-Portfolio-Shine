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

const getMemoryAdminPasswordHash = async () => {
  if (!memoryAdminPasswordHash) {
    const salt = await bcrypt.genSalt(10);
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
    memoryAdminPasswordHash = await bcrypt.hash(defaultPass, salt);
  }
  return memoryAdminPasswordHash;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
    expiresIn: '12h',
  });
};

// POST /api/admin/login (With 24-Hour Lockout after 3 Failed Attempts)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check 24-hour Lockout
  if (Date.now() < lockoutExpiryTime) {
    const msRemaining = lockoutExpiryTime - Date.now();
    const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));
    const minsLeft = Math.ceil((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return res.status(429).json({
      message: `SECURITY LOCKOUT ACTIVE: 3 failed password attempts reached. Account locked for 24 hours. Try again in ${hoursLeft}h ${minsLeft}m.`,
    });
  }

  try {
    let isValid = false;
    let authUserId = 'mem_admin_1';
    let authUsername = memoryAdminUsername;

    if (!isDbConnected) {
      const hash = await getMemoryAdminPasswordHash();
      const isMatch = await bcrypt.compare(password, hash);
      if (username === memoryAdminUsername && isMatch) {
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
      if (failedLoginCount >= 3) {
        lockoutExpiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours Lockout
        return res.status(429).json({
          message: 'SECURITY ALERT: 3 consecutive failed password attempts. Account is now LOCKED for 24 hours.',
        });
      }
      const attemptsLeft = 3 - failedLoginCount;
      return res.status(401).json({
        message: `Invalid username or password. Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before 24-hour lockout.`,
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

// POST /api/admin/request-security-otp (Send 6-digit OTP email for any action)
router.post('/request-security-otp', async (req, res) => {
  const { actionName = 'Security Verification' } = req.body || {};
  try {
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    activeOtpStore = {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    };

    // Dispatch email asynchronously without freezing UI
    sendPasswordResetOTP({ otpCode, actionName }).catch((err) => {
      console.warn('OTP Email send note:', err.message);
    });

    return res.json({
      message: 'Verification OTP sent to your registered email (kumarharsh1851@gmail.com).',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/change-username (Requires currentPassword + OTP)
router.put('/change-username', protect, async (req, res) => {
  const { currentPassword, newUsername, otpCode } = req.body;

  if (!currentPassword || !newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters.' });
  }

  if (!otpCode || !activeOtpStore.code || Date.now() > activeOtpStore.expiresAt || activeOtpStore.code !== otpCode.trim()) {
    return res.status(400).json({ message: 'Invalid or expired 6-digit OTP code. Click "Send OTP" to receive a new code.' });
  }

  try {
    if (!isDbConnected) {
      const hash = await getMemoryAdminPasswordHash();
      const isMatch = await bcrypt.compare(currentPassword, hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password incorrect.' });
      }
      memoryAdminUsername = newUsername.trim();
      activeOtpStore = { code: null, expiresAt: 0 };
      return res.json({ message: 'Username updated successfully!', username: memoryAdminUsername });
    }

    const admin = await Admin.findOne();
    if (admin && (await admin.matchPassword(currentPassword))) {
      admin.username = newUsername.trim();
      await admin.save();
      activeOtpStore = { code: null, expiresAt: 0 };
      return res.json({ message: 'Username updated successfully!', username: admin.username });
    } else {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/change-password (Requires currentPassword + OTP)
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword, otpCode } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  if (!otpCode || !activeOtpStore.code || Date.now() > activeOtpStore.expiresAt || activeOtpStore.code !== otpCode.trim()) {
    return res.status(400).json({ message: 'Invalid or expired 6-digit OTP code. Click "Send OTP" to receive a new code.' });
  }

  try {
    if (!isDbConnected) {
      const hash = await getMemoryAdminPasswordHash();
      const isMatch = await bcrypt.compare(currentPassword, hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password incorrect.' });
      }
      const salt = await bcrypt.genSalt(10);
      memoryAdminPasswordHash = await bcrypt.hash(newPassword, salt);
      activeOtpStore = { code: null, expiresAt: 0 };
      return res.json({ message: 'Password updated successfully!' });
    }

    const admin = await Admin.findOne();
    if (admin && (await admin.matchPassword(currentPassword))) {
      admin.password = newPassword;
      await admin.save();
      activeOtpStore = { code: null, expiresAt: 0 };
      return res.json({ message: 'Password updated successfully!' });
    } else {
      return res.status(400).json({ message: 'Current password incorrect.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/request-password-reset (Send 6-digit OTP email)
router.post('/request-password-reset', async (req, res) => {
  try {
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    activeOtpStore = {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
    };

    // Dispatch email asynchronously without freezing UI
    sendPasswordResetOTP({ otpCode, actionName: 'Password Reset' }).catch((err) => {
      console.warn('OTP Email send note:', err.message);
    });

    return res.json({
      message: 'Verification OTP sent to your registered email (kumarharsh1851@gmail.com).',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/verify-reset-code (Verify OTP & Reset Password)
router.post('/verify-reset-code', async (req, res) => {
  const { otpCode, newPassword } = req.body;

  if (!otpCode || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'OTP code and new password (min 6 chars) required.' });
  }

  if (!activeOtpStore.code || Date.now() > activeOtpStore.expiresAt) {
    return res.status(400).json({ message: 'Verification OTP has expired or is invalid. Request a new OTP.' });
  }

  if (activeOtpStore.code !== otpCode.trim()) {
    return res.status(400).json({ message: 'Invalid OTP code.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    memoryAdminPasswordHash = newHash;

    if (isDbConnected) {
      const admin = await Admin.findOne();
      if (admin) {
        admin.password = newPassword;
        await admin.save();
      }
    }

    activeOtpStore = { code: null, expiresAt: 0 };
    res.json({ message: 'Password reset successfully! You can now log in.' });
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
    if (!isDbConnected) {
      const newProj = { _id: String(Date.now()), ...req.body };
      memoryStore.projects.unshift(newProj);
      return res.status(201).json(newProj);
    }
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/projects/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      const idx = memoryStore.projects.findIndex((p) => p._id === req.params.id);
      if (idx !== -1) {
        memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...req.body };
        return res.json(memoryStore.projects[idx]);
      }
    }
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/projects/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      memoryStore.projects = memoryStore.projects.filter((p) => p._id !== req.params.id);
      return res.json({ message: 'Project deleted' });
    }
    await Project.findByIdAndDelete(req.params.id);
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
    if (!isDbConnected) {
      const newSkill = { _id: String(Date.now()), ...req.body };
      memoryStore.skills.push(newSkill);
      return res.status(201).json(newSkill);
    }
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/skills/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      const idx = memoryStore.skills.findIndex((s) => s._id === req.params.id);
      if (idx !== -1) {
        memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...req.body };
        return res.json(memoryStore.skills[idx]);
      }
    }
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(skill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/skills/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      memoryStore.skills = memoryStore.skills.filter((s) => s._id !== req.params.id);
      return res.json({ message: 'Skill deleted' });
    }
    await Skill.findByIdAndDelete(req.params.id);
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
    if (!isDbConnected) {
      memoryStore.messages = memoryStore.messages.filter((m) => m._id !== req.params.id);
      return res.json({ message: 'Message deleted' });
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

