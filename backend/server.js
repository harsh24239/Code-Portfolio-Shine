import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import { createRateLimiter } from './middleware/rateLimit.js';

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
const loginLimiter = createRateLimiter({
  namespace: 'admin-login',
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Too many login attempts. Please try again after 15 minutes.',
});
const contactLimiter = createRateLimiter({
  namespace: 'contact',
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: 'Transmission limit reached. Please try again later.',
});
const mfaLimiter = createRateLimiter({
  namespace: 'admin-mfa-login',
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many MFA verification attempts. Please try again later.',
});

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : isProduction ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5050', 'http://127.0.0.1:5050'];

if (isProduction) app.set('trust proxy', 1);

app.use(
  cors((req, callback) => {
    const origin = req.get('Origin');
    const requestOrigin = `${req.protocol}://${req.get('Host')}`;
    const allowed = !origin || origin === requestOrigin || allowedOrigins.includes(origin);

    callback(null, {
      origin: allowed,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      credentials: true,
    });
  })
);

app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: false, limit: '128kb', parameterLimit: 30 }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/admin/login', loginLimiter);
app.use('/api/admin/mfa/verify-login', mfaLimiter);
app.use('/api/contact', contactLimiter);

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let startupReady = false;

app.get('/health', (req, res) => {
  const ready = startupReady && (isDbConnected || allowInMemoryFallback);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'OK' : 'DEGRADED',
    message: ready ? 'Shadow Portfolio Backend Operational' : 'Service is not ready.',
  });
});

// Return stable JSON without echoing parser errors, stack traces or request bodies.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = [400, 413, 415].includes(error.status) ? error.status : 500;
  const message = status === 413 ? 'Request body is too large.'
    : status === 415 ? 'Unsupported request encoding.'
      : status === 400 ? 'Invalid request body.' : 'Request could not be completed.';
  return res.status(status).json({ message });
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
      memoryStore.adminCredentials.mfaEnabled = Boolean(admin.mfaEnabled);
      memoryStore.adminCredentials.mfaSecret = admin.mfaSecret;
      memoryStore.adminCredentials.mfaPendingSecret = admin.mfaPendingSecret;
      memoryStore.adminCredentials.mfaBackupCodes = admin.mfaBackupCodes || [];
      memoryStore.adminCredentials.mfaLastUsedStep = admin.mfaLastUsedStep || -1;
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
      if (docs.length > 0 || profile) {
        memoryStore[storeKey] = docs.map(toPlainObj);
        console.log(`✓ ${docs.length} ${label} loaded from MongoDB`);
        return;
      }

      // Let MongoDB generate valid ObjectIds for seeded records.
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
const PORT = process.env.PORT || 5050;

const startServer = async () => {
  assertProductionConfig();
  const connected = await connectDB();
  if (connected) {
    await syncFromMongoDB();
  } else if (!allowInMemoryFallback) {
    throw new Error('MongoDB is unavailable. Set MONGO_URI or enable ALLOW_IN_MEMORY_FALLBACK only for local development.');
  } else {
    console.warn('⚠ ALLOW_IN_MEMORY_FALLBACK=true — admin changes are temporary and will be lost on restart.');
  }

  startupReady = true;
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server listening on http://localhost:${PORT}`);
    console.log(`🔒 Admin Panel: http://localhost:${PORT}/admin\n`);
  });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE'
      ? `✗ Port ${PORT} is already in use. Set PORT to an available port and restart.`
      : `✗ HTTP server failed: ${error.message}`);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error(`✗ Server startup blocked: ${error.message}`);
  process.exitCode = 1;
});
