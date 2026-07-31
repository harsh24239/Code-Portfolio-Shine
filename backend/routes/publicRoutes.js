import express from 'express';
import { isDbConnected } from '../config/db.js';
import { memoryStore } from '../store/memoryStore.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Testimonial } from '../models/Testimonial.js';
import { Message } from '../models/Message.js';

const router = express.Router();

// GET all public portfolio data
router.get('/portfolio', async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({
        profile: memoryStore.profile,
        projects: memoryStore.projects,
        skills: memoryStore.skills,
        testimonials: memoryStore.testimonials,
      });
    }

    const profile = await Profile.findOne().sort({ createdAt: -1 });
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: -1 });
    const skills = await Skill.find().sort({ createdAt: 1 });
    const testimonials = await Testimonial.find().sort({ createdAt: 1 });

    res.json({
      profile: profile || memoryStore.profile,
      projects: projects.length > 0 ? projects : memoryStore.projects,
      skills: skills.length > 0 ? skills : memoryStore.skills,
      testimonials: testimonials.length > 0 ? testimonials : memoryStore.testimonials,
    });
  } catch (error) {
    res.json({
      profile: memoryStore.profile,
      projects: memoryStore.projects,
      skills: memoryStore.skills,
      testimonials: memoryStore.testimonials,
    });
  }
});

// POST contact form message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

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
      return res.status(201).json({ message: 'Transmission received.', messageId: newMsg._id });
    }

    const newMessage = await Message.create({
      name,
      email,
      subject: subject || 'Portfolio Contact',
      message,
    });

    res.status(201).json({ message: 'Transmission received.', messageId: newMessage._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record transmission', error: error.message });
  }
});

export default router;
