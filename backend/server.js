import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, isDbConnected } from './config/db.js';
import { memoryStore, DEFAULT_DATA } from './store/memoryStore.js';
import publicRoutes from './routes/publicRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { Admin } from './models/Admin.js';
import { Profile } from './models/Profile.js';
import { Project } from './models/Project.js';
import { Skill } from './models/Skill.js';
import { FocusArea } from './models/FocusArea.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// Anti-caching headers for admin routes
app.use(['/admin', '/api/admin'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Transmission limit reached. Please try again later.' },
});

// CORS
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
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/admin/login', loginLimiter);
app.use('/api/contact', contactLimiter);

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    db: isDbConnected ? 'MongoDB Atlas' : 'in-memory only',
    message: 'Shadow Portfolio Backend Operational',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  STARTUP SYNC — MongoDB Atlas → memoryStore
//
//  Runs once on every server start/restart.
//  If MongoDB is connected, pulls the LATEST saved data into the in-memory
//  cache so the app immediately reflects whatever the user last changed.
//  If no data exists yet in MongoDB, seeds it from DEFAULT_DATA defaults.
// ─────────────────────────────────────────────────────────────────────────────
const syncFromMongoDB = async () => {
  if (!isDbConnected) {
    console.log('ℹ  DB not connected — serving default in-memory data.');
    return;
  }

  try {
    // ── Admin ────────────────────────────────────────────────────────────────
    let admin = await Admin.findOne();
    if (admin) {
      memoryStore.adminCredentials.username = admin.username;
      memoryStore.adminCredentials.passwordHash = admin.password; // raw bcrypt hash
      console.log(`✓ Admin (${admin.username}) loaded from MongoDB`);
    } else {
      // First boot: seed from defaults
      const created = await Admin.create({
        username: DEFAULT_DATA.adminCredentials.username,
        password: DEFAULT_DATA.adminCredentials.passwordHash, // pre-hashed, hook skips re-hash
      });
      memoryStore.adminCredentials.username = created.username;
      memoryStore.adminCredentials.passwordHash = created.password;
      console.log('✓ Admin seeded to MongoDB (first boot)');
    }

    // ── Profile ──────────────────────────────────────────────────────────────
    let profile = await Profile.findOne();
    if (profile) {
      const p = profile.toObject();
      delete p._id; delete p.__v; delete p.createdAt; delete p.updatedAt;
      Object.assign(memoryStore.profile, p);
      console.log('✓ Profile loaded from MongoDB');
    } else {
      await Profile.create(DEFAULT_DATA.profile);
      console.log('✓ Profile seeded to MongoDB (first boot)');
    }

    // ── Projects ─────────────────────────────────────────────────────────────
    const dbProjects = await Project.find().sort({ sortOrder: 1, createdAt: 1 });
    if (dbProjects.length > 0) {
      memoryStore.projects = dbProjects.map(toPlainObj);
      console.log(`✓ ${dbProjects.length} Projects loaded from MongoDB`);
    } else {
      const inserted = await Project.insertMany(DEFAULT_DATA.projects);
      memoryStore.projects = inserted.map(toPlainObj);
      console.log('✓ Projects seeded to MongoDB (first boot)');
    }

    // ── Skills ───────────────────────────────────────────────────────────────
    const dbSkills = await Skill.find().sort({ createdAt: 1 });
    if (dbSkills.length > 0) {
      memoryStore.skills = dbSkills.map(toPlainObj);
      console.log(`✓ ${dbSkills.length} Skills loaded from MongoDB`);
    } else {
      const inserted = await Skill.insertMany(DEFAULT_DATA.skills);
      memoryStore.skills = inserted.map(toPlainObj);
      console.log('✓ Skills seeded to MongoDB (first boot)');
    }

    // ── Focus Areas ──────────────────────────────────────────────────────────
    const dbFocusAreas = await FocusArea.find().sort({ sortOrder: 1, createdAt: 1 });
    if (dbFocusAreas.length > 0) {
      memoryStore.focusAreas = dbFocusAreas.map(toPlainObj);
      console.log(`✓ ${dbFocusAreas.length} Focus Areas loaded from MongoDB`);
    } else {
      const inserted = await FocusArea.insertMany(DEFAULT_DATA.focusAreas);
      memoryStore.focusAreas = inserted.map(toPlainObj);
      console.log('✓ Focus Areas seeded to MongoDB (first boot)');
    }

    console.log('✓ Startup sync complete — all data ready from MongoDB Atlas');
  } catch (err) {
    console.error('✗ Startup sync error:', err.message);
    console.log('  Serving default in-memory data as fallback.');
  }
};

/** Convert a Mongoose doc to a plain JS object with _id as string */
const toPlainObj = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5050;

app.listen(PORT, async () => {
  console.log(`\n🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔒 Admin Panel: http://localhost:${PORT}/admin\n`);
  await connectDB();
  await syncFromMongoDB();
});
