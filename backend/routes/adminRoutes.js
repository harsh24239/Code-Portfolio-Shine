import express from 'express';
import jwt from 'jsonwebtoken';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { Admin } from '../models/Admin.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Testimonial } from '../models/Testimonial.js';
import { Message } from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
    expiresIn: '30d',
  });
};

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!isDbConnected) {
      const defaultUser = process.env.ADMIN_USERNAME || 'admin';
      const defaultPass = process.env.ADMIN_PASSWORD || 'admin123';
      if (username === defaultUser && password === defaultPass) {
        return res.json({
          token: generateToken('mem_admin_1'),
          username: defaultUser,
        });
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    }

    const admin = await Admin.findOne({ username });
    if (admin && (await admin.matchPassword(password))) {
      return res.json({
        token: generateToken(admin._id),
        username: admin.username,
      });
    } else {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/me
router.get('/me', protect, async (req, res) => {
  res.json({ status: 'authenticated', user: req.user });
});

// --- PROFILE ---
router.put('/profile', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      Object.assign(memoryStore.profile, req.body);
      return res.json(memoryStore.profile);
    }

    let profile = await Profile.findOne();
    if (profile) {
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      profile = await Profile.create(req.body);
    }
    res.json(profile);
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

// --- TESTIMONIALS ---
router.get('/testimonials', protect, async (req, res) => {
  if (!isDbConnected) return res.json(memoryStore.testimonials);
  const testimonials = await Testimonial.find().sort({ createdAt: 1 });
  res.json(testimonials.length > 0 ? testimonials : memoryStore.testimonials);
});

router.post('/testimonials', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      const newTest = { _id: String(Date.now()), ...req.body };
      memoryStore.testimonials.push(newTest);
      return res.status(201).json(newTest);
    }
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/testimonials/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      const idx = memoryStore.testimonials.findIndex((t) => t._id === req.params.id);
      if (idx !== -1) {
        memoryStore.testimonials[idx] = { ...memoryStore.testimonials[idx], ...req.body };
        return res.json(memoryStore.testimonials[idx]);
      }
    }
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/testimonials/:id', protect, async (req, res) => {
  try {
    if (!isDbConnected) {
      memoryStore.testimonials = memoryStore.testimonials.filter((t) => t._id !== req.params.id);
      return res.json({ message: 'Testimonial deleted' });
    }
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Testimonial deleted' });
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
