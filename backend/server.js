import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { Admin } from './models/Admin.js';
import { Profile } from './models/Profile.js';
import { Project } from './models/Project.js';
import { Skill } from './models/Skill.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middleware (Helmet HTTP Headers)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline styles & fonts for admin panel SPA
  })
);

// Strict Anti-Caching & Session Protection Headers
app.use('/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use('/api/admin', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Rate Limiting Security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 contact transmissions per hour
  message: { message: 'Transmission limit reached. Please try again later.' },
});

// CORS Security
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Access denied from this origin.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve Admin Dashboard Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Apply Rate Limiters
app.use('/api/admin/login', loginLimiter);
app.use('/api/contact', contactLimiter);

// API Routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// Admin Route SPA fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shadow Portfolio Backend Operational' });
});

// Seed & Sync Initial Data with MongoDB Atlas
const seedInitialData = async () => {
  try {
    if (!isDbConnected) return;

    // Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });
      console.log('✓ Default Admin created in MongoDB Atlas');
    }

    // Profile
    const dbProfile = await Profile.findOne().sort({ createdAt: -1 });
    if (dbProfile) {
      const obj = dbProfile.toObject();
      delete obj._id;
      delete obj.__v;
      Object.assign(memoryStore.profile, obj);
      console.log('✓ Profile synced from MongoDB Atlas to memoryStore');
    } else if (memoryStore.profile) {
      await Profile.create(memoryStore.profile);
      console.log('✓ Profile seeded to MongoDB Atlas');
    }

    // Projects
    const dbProjects = await Project.find().sort({ sortOrder: 1, createdAt: -1 });
    if (dbProjects && dbProjects.length > 0) {
      memoryStore.projects = dbProjects.map((p) => {
        const obj = p.toObject();
        obj._id = String(obj._id);
        return obj;
      });
      console.log(`✓ ${dbProjects.length} Projects synced from MongoDB Atlas to memoryStore`);
    } else if (memoryStore.projects && memoryStore.projects.length > 0) {
      await Project.insertMany(memoryStore.projects);
      console.log('✓ Projects seeded to MongoDB Atlas');
    }

    // Skills
    const dbSkills = await Skill.find().sort({ createdAt: 1 });
    if (dbSkills && dbSkills.length > 0) {
      memoryStore.skills = dbSkills.map((s) => {
        const obj = s.toObject();
        obj._id = String(obj._id);
        return obj;
      });
      console.log(`✓ ${dbSkills.length} Skills synced from MongoDB Atlas to memoryStore`);
    } else if (memoryStore.skills && memoryStore.skills.length > 0) {
      await Skill.insertMany(memoryStore.skills);
      console.log('✓ Skills seeded to MongoDB Atlas');
    }

    // Persist synced data locally
    persistMemoryStore();
  } catch (error) {
    console.warn('⚠ Database seeding/sync note:', error.message);
  }
};

const PORT = process.env.PORT || 5050;

app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔒 Admin Panel available at http://localhost:${PORT}/admin`);
  await connectDB();
  await seedInitialData();
});
