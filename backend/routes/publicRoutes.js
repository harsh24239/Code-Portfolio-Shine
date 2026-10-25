import express from 'express';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { FocusArea } from '../models/FocusArea.js';
import { Message } from '../models/Message.js';
import { sendContactEmailNotification } from '../config/email.js';
import { allowInMemoryFallback } from '../config/security.js';
import { isValidEmail, normalizeText } from '../utils/validation.js';

const router = express.Router();

// GET /api/portfolio — main public data endpoint
router.get('/portfolio', async (req, res) => {
  try {
    if (!isDbConnected && !allowInMemoryFallback) {
      return res.status(503).json({ message: 'Portfolio data is temporarily unavailable.' });
    }

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
      memoryStore.projects = projects.map(toPlain);
      memoryStore.skills = skills.map(toPlain);
      memoryStore.focusAreas = focusAreas.map(toPlain);

      return res.json({
        profile: profile || memoryStore.profile,
        projects,
        skills,
        focusAreas,
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
    if (!allowInMemoryFallback) {
      return res.status(503).json({ message: 'Portfolio data is temporarily unavailable.' });
    }
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
    if (!isDbConnected && !allowInMemoryFallback) {
      return res.status(503).json({ message: 'Contact service is temporarily unavailable.' });
    }

    const name = normalizeText(req.body?.name, 120);
    const email = normalizeText(req.body?.email, 254);
    const subject = normalizeText(req.body?.subject, 200) || 'Portfolio Contact';
    const message = normalizeText(req.body?.message, 16000, { allowNewlines: true });
    if (!name || !email || !message || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    let messageId;

    if (isDbConnected) {
      const doc = await Message.create({
        name,
        email,
        subject,
        message,
      });
      messageId = doc._id;
    } else {
      const newMsg = {
        _id: String(Date.now()),
        name, email,
        subject,
        message,
        createdAt: new Date().toISOString(),
      };
      memoryStore.messages.unshift(newMsg);
      memoryStore.messages.splice(100);
      messageId = newMsg._id;
    }

    // Keep the persistent inbox copy even if the email provider is unavailable.
    // Wait for provider acceptance so the frontend never mistakes a saved record for email.
    const emailAccepted = await sendContactEmailNotification({ name, email, subject, message, messageId });
    res.status(201).json({
      message: 'Message received.',
      messageId,
      emailDelivery: emailAccepted ? 'accepted' : 'unavailable',
    });
  } catch (err) {
    console.error('Contact error:', err.message);
    res.status(500).json({ message: 'Failed to record transmission.' });
  }
});

const toPlain = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

export default router;
