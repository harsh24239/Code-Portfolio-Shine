import express from 'express';
import { isDbConnected } from '../config/db.js';
import { memoryStore, persistMemoryStore } from '../store/memoryStore.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Message } from '../models/Message.js';
import { sendContactEmailNotification } from '../config/email.js';

const router = express.Router();

// GET all public portfolio data
router.get('/portfolio', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({
        profile: memoryStore.profile,
        projects: memoryStore.projects,
        skills: memoryStore.skills,
        focusAreas: memoryStore.focusAreas,
      });
    }

    const profile = await Profile.findOne().sort({ createdAt: -1 });
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: -1 });
    const skills = await Skill.find().sort({ createdAt: 1 });

    res.json({
      profile: profile || memoryStore.profile,
      projects: projects.length > 0 ? projects : memoryStore.projects,
      skills: skills.length > 0 ? skills : memoryStore.skills,
      focusAreas: memoryStore.focusAreas,
    });
  } catch (error) {
    res.json({
      profile: memoryStore.profile,
      projects: memoryStore.projects,
      skills: memoryStore.skills,
      focusAreas: memoryStore.focusAreas,
    });
  }
});

// POST contact form message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    let messageId;

    memoryStore.messages = memoryStore.messages || [];

    if (!isDbConnected) {
      const newMsg = {
        _id: String(Date.now()),
        name,
        email,
        subject: subject || 'Portfolio Contact',
        message,
        createdAt: new Date().toISOString(),
      };
      memoryStore.messages.unshift(newMsg);
      persistMemoryStore();
      messageId = newMsg._id;
    } else {
      const newMessage = await Message.create({
        name,
        email,
        subject: subject || 'Portfolio Contact',
        message,
      });
      memoryStore.messages.unshift({
        _id: String(newMessage._id),
        name,
        email,
        subject: subject || 'Portfolio Contact',
        message,
        createdAt: newMessage.createdAt || new Date().toISOString(),
      });
      persistMemoryStore();
      messageId = newMessage._id;
    }

    // Trigger instant email notification asynchronously
    try {
      sendContactEmailNotification({ name, email, subject, message }).catch((err) => {
        console.warn('Email notification note:', err.message);
      });
    } catch (e) {
      console.warn('Email send exception:', e.message);
    }

    res.status(201).json({ message: 'Transmission received.', messageId });
  } catch (error) {
    console.error('Contact handler error:', error);
    res.status(500).json({ message: 'Failed to record transmission', error: error.message });
  }
});

export default router;
