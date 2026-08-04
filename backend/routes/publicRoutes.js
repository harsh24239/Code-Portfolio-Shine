import express from 'express';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { FocusArea } from '../models/FocusArea.js';
import { Message } from '../models/Message.js';
import { sendContactEmailNotification } from '../config/email.js';

const router = express.Router();

// GET /api/portfolio — main public data endpoint
router.get('/portfolio', async (req, res) => {
  try {
    if (isDbConnected) {
      const [profile, projects, skills, focusAreas] = await Promise.all([
        Profile.findOne(),
        Project.find().sort({ sortOrder: 1, createdAt: 1 }),
        Skill.find().sort({ createdAt: 1 }),
        FocusArea.find().sort({ sortOrder: 1, createdAt: 1 }),
      ]);

      // Keep memoryStore in sync (so admin panel always reflects latest)
      if (profile) {
        const p = profile.toObject();
        delete p._id; delete p.__v; delete p.createdAt; delete p.updatedAt;
        Object.assign(memoryStore.profile, p);
      }
      if (projects.length > 0) memoryStore.projects = projects.map(toPlain);
      if (skills.length > 0) memoryStore.skills = skills.map(toPlain);
      if (focusAreas.length > 0) memoryStore.focusAreas = focusAreas.map(toPlain);

      return res.json({
        profile: profile || memoryStore.profile,
        projects: projects.length > 0 ? projects : memoryStore.projects,
        skills: skills.length > 0 ? skills : memoryStore.skills,
        focusAreas: focusAreas.length > 0 ? focusAreas : memoryStore.focusAreas,
      });
    }

    // No DB — serve in-memory defaults
    return res.json({
      profile: memoryStore.profile,
      projects: memoryStore.projects,
      skills: memoryStore.skills,
      focusAreas: memoryStore.focusAreas,
    });
  } catch (err) {
    console.error('Portfolio route error:', err.message);
    return res.json({
      profile: memoryStore.profile,
      projects: memoryStore.projects,
      skills: memoryStore.skills,
      focusAreas: memoryStore.focusAreas,
    });
  }
});

// POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    let messageId;

    if (isDbConnected) {
      const doc = await Message.create({
        name,
        email,
        subject: subject || 'Portfolio Contact',
        message,
      });
      messageId = doc._id;
      memoryStore.messages.unshift({
        _id: String(doc._id),
        name, email,
        subject: subject || 'Portfolio Contact',
        message,
        createdAt: doc.createdAt,
      });
    } else {
      const newMsg = {
        _id: String(Date.now()),
        name, email,
        subject: subject || 'Portfolio Contact',
        message,
        createdAt: new Date().toISOString(),
      };
      memoryStore.messages.unshift(newMsg);
      messageId = newMsg._id;
    }

    // Non-blocking email notification
    sendContactEmailNotification({ name, email, subject, message }).catch((err) =>
      console.warn('Email notification failed:', err.message)
    );

    res.status(201).json({ message: 'Transmission received.', messageId });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ message: 'Failed to record transmission', error: err.message });
  }
});

const toPlain = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

export default router;
