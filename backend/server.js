import express from 'express';
import cors from 'cors';
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
import { Testimonial } from './models/Testimonial.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Admin Dashboard Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Admin Route SPA fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Shadow Portfolio Backend Operational' });
});

// Seed Initial Data
const seedInitialData = async () => {
  try {
    // 1. Admin User
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });
      console.log('✓ Default Admin created (Username: admin | Password: admin123)');
    }

    // 2. Profile
    const profileCount = await Profile.countDocuments();
    if (profileCount === 0) {
      await Profile.create({
        eyebrow: 'Full-Stack Developer & Code Architect',
        title1: 'CODE',
        titleAccent: 'IN THE',
        title2: 'SHADOWS',
        subtext: 'Full-stack engineer. Open-source contributor. I build scalable systems, craft pixel-perfect interfaces, and write code that runs silent and fast — like a shadow in the machine.',
        projectsShipped: '48+',
        yearsCoding: '9+',
        clientsServed: '31+',
        status: 'Taking Missions',
        statusDetail: 'Available for engagements beginning September 2026. Priority given to long-duration contracts requiring sustained operational focus.',
        email: 'kumarharsh1851@gmail.com',
        pgpKey: '0xA4B7C9E1',
      });
      console.log('✓ Default Profile seeded.');
    }

    // 3. Projects
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      await Project.insertMany([
        {
          title: 'ShadowBoard',
          tag: 'Full-Stack — SaaS',
          description: 'A real-time project management SaaS built with Next.js, Supabase, and WebSockets. 10K+ active users, 99.9% uptime, deployed on AWS with zero-downtime CI/CD pipeline.',
          year: '2025',
          link: '',
          iconText: 'SB',
          featured: true,
          sortOrder: 0,
        },
        {
          title: 'KageUI',
          tag: 'React — TypeScript',
          description: 'Open-source component library with 40+ dark-themed UI components. 2.3K GitHub stars, full TypeScript support, Storybook docs.',
          year: '2025',
          link: '',
          iconText: 'KU',
          featured: false,
          sortOrder: 1,
        },
        {
          title: 'NinjaBot',
          tag: 'Python — AI',
          description: 'LLM-powered code review bot that integrates with GitHub PRs. Catches bugs, suggests refactors, enforces style guides. 94% accuracy on test suite.',
          year: '2024',
          link: '',
          iconText: 'NB',
          featured: false,
          sortOrder: 2,
        },
        {
          title: 'StealthAPI',
          tag: 'Go — Microservices',
          description: 'High-performance REST API gateway in Go handling 1M+ requests/day. Rate limiting, JWT auth, Redis caching, Kubernetes orchestration.',
          year: '2024',
          link: '',
          iconText: 'SA',
          featured: false,
          sortOrder: 3,
        },
      ]);
      console.log('✓ Default Projects seeded.');
    }

    // 4. Skills
    const skillCount = await Skill.countDocuments();
    if (skillCount === 0) {
      await Skill.insertMany([
        { name: 'Frontend Mastery', desc: 'React, Next.js, TypeScript, Tailwind CSS. Pixel-perfect UIs that load fast and feel alive.', pips: 5 },
        { name: 'Backend Engineering', desc: 'Node.js, Python, Go, REST & GraphQL APIs. Scalable server architecture built to endure.', pips: 5 },
        { name: 'Database & Cloud', desc: 'PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes. Infrastructure that never sleeps.', pips: 4 },
        { name: 'DevOps & CI/CD', desc: 'GitHub Actions, Jenkins, Terraform, Linux. Automated pipelines that deploy without hesitation.', pips: 4 },
        { name: 'Security & Auth', desc: 'OAuth2, JWT, penetration testing, OWASP hardening. Code that guards itself like a fortress.', pips: 5 },
        { name: 'AI & Automation', desc: 'LLM integration, Python automation, web scraping, data pipelines. Machines that work while you sleep.', pips: 4 },
      ]);
      console.log('✓ Default Skills seeded.');
    }

    // 5. Testimonials
    const testCount = await Testimonial.countDocuments();
    if (testCount === 0) {
      await Testimonial.insertMany([
        {
          quote: 'Our security posture was compromised in ways our internal team never identified. This engagement changed how we think about infrastructure permanently.',
          name: 'Marcus Reyes',
          role: 'CISO — Pacific Meridian Holdings',
          org: 'Financial Services',
        },
        {
          quote: 'The brand system delivered was unlike anything our previous agencies produced. Restrained, dangerous, and exactly right for our market position.',
          name: 'Yuki Tanaka',
          role: 'Founder — Katana Consulting Group',
          org: 'Strategic Intelligence',
        },
        {
          quote: "The OSINT pipeline has been running for 14 months without downtime. It processes threat data our analysts didn't know to ask for. Transformational work.",
          name: 'Kwame Osei',
          role: 'Director of Operations — SentryWatch Ltd',
          org: 'Threat Intelligence',
        },
        {
          quote: '12 seconds. No dialogue. Our users understood the product immediately. The motion work was precise, spare, and devastatingly effective.',
          name: 'Dmitri Volkov',
          role: 'Head of Product — CipherChannel',
          org: 'Encrypted Communications',
        },
      ]);
      console.log('✓ Default Testimonials seeded.');
    }
  } catch (error) {
    console.warn('⚠ Database seeding note:', error.message);
  }
};

const PORT = process.env.PORT || 5050;

app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`🔒 Admin Panel available at http://localhost:${PORT}/admin`);
  await connectDB();
  await seedInitialData();
});
