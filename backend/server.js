import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, isDbConnected } from './config/db.js';
import { allowInMemoryFallback, assertProductionConfig, isProduction } from './config/security.js';
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));

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
  ? process.env.ALLOWED_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : isProduction ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/admin/login', loginLimiter);
app.use('/api/contact', contactLimiter);

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let startupReady = false;

app.get('/health', (req, res) => {
  const persistent = isDbConnected;
  const ready = startupReady && (persistent || allowInMemoryFallback);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'OK' : 'DEGRADED',
    message: ready ? 'Shadow Portfolio Backend Operational' : 'Service is not ready.',
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
  if (!isDbConnected) throw new Error('Cannot synchronize portfolio data before MongoDB is connected.');

    // ── Admin ────────────────────────────────────────────────────────────────
    let admin = await Admin.findOne();
    if (admin) {
      memoryStore.adminCredentials.username = admin.username;
      memoryStore.adminCredentials.passwordHash = admin.password;
      memoryStore.adminCredentials.tokenVersion = admin.tokenVersion || 0;
      console.log(`✓ Admin (${admin.username}) loaded from MongoDB`);
    } else {
      const created = await Admin.create({
        username: DEFAULT_DATA.adminCredentials.username,
        password: DEFAULT_DATA.adminCredentials.passwordHash,
        tokenVersion: 0,
      });
      memoryStore.adminCredentials.username = created.username;
      memoryStore.adminCredentials.passwordHash = created.password;
      memoryStore.adminCredentials.tokenVersion = created.tokenVersion || 0;
      console.log('✓ Admin seeded to MongoDB (first boot)');
    }

    // ── Profile ──────────────────────────────────────────────────────────────
    const profile = await Profile.findOne();
    if (profile) {
      const p = profile.toObject();
      delete p._id; delete p.__v; delete p.createdAt; delete p.updatedAt;
      Object.assign(memoryStore.profile, p);
      console.log('✓ Profile loaded from MongoDB');
    } else {
      await Profile.create(DEFAULT_DATA.profile);
      console.log('✓ Profile seeded to MongoDB (first boot)');
    }

    const syncCollection = async (Model, defaults, sort, storeKey, label) => {
      const docs = await Model.find().sort(sort);
      if (docs.length > 0) {
        memoryStore[storeKey] = docs.map(toPlainObj);
        console.log(`✓ ${docs.length} ${label} loaded from MongoDB`);
        return;
      }

      // Let MongoDB generate valid ObjectIds for seeded records. Placeholder
      // IDs make edits appear successful while remaining memory-only.
      const inserted = await Model.insertMany(defaults.map(({ _id, ...item }) => item));
      memoryStore[storeKey] = inserted.map(toPlainObj);
      console.log(`✓ ${label} seeded to MongoDB (first boot)`);
    };

    await syncCollection(Project, DEFAULT_DATA.projects, { sortOrder: 1, createdAt: 1 }, 'projects', 'Projects');
    await syncCollection(Skill, DEFAULT_DATA.skills, { createdAt: 1 }, 'skills', 'Skills');
    await syncCollection(FocusArea, DEFAULT_DATA.focusAreas, { sortOrder: 1, createdAt: 1 }, 'focusAreas', 'Focus areas');

    console.log('✓ Startup sync complete — all data ready from MongoDB Atlas');
};

/** Convert a Mongoose doc to a plain JS object with _id as string */
const toPlainObj = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj._id = String(obj._id);
  delete obj.__v;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  assertProductionConfig();
  const connected = await connectDB();

  if (connected) {
    await syncFromMongoDB();
  } else if (!allowInMemoryFallback) {
    throw new Error('MongoDB is unavailable. Set MONGO_URI or explicitly enable ALLOW_IN_MEMORY_FALLBACK for local-only work.');
  } else {
    console.warn('⚠ ALLOW_IN_MEMORY_FALLBACK=true — admin changes are temporary and will be lost on restart.');
  }

  if (!process.env.JWT_SECRET && allowInMemoryFallback) {
    console.warn('⚠ No JWT_SECRET configured — using an ephemeral development secret for this process only.');
  }

  startupReady = true;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server listening on http://localhost:${PORT}`);
    console.log(`🔒 Admin Panel: http://localhost:${PORT}/admin\n`);
  });
};

startServer().catch((error) => {
  console.error(`✗ Server startup blocked: ${error.message}`);
  process.exitCode = 1;
});
