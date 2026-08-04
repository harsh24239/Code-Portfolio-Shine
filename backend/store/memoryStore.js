/**
 * memoryStore.js — Pure in-memory cache of MongoDB Atlas data.
 *
 * WHY NO FILE I/O:
 * Render free tier uses an ephemeral disk. Any file written at runtime
 * (user_data.json) is wiped the moment the container restarts or goes to
 * sleep. Saving to disk therefore gives a false sense of persistence.
 *
 * The ONLY reliable persistence layer on Render is MongoDB Atlas.
 * This module holds a live in-memory copy of the latest MongoDB data.
 * server.js populates it on startup. Every write route updates it instantly.
 */

import bcrypt from 'bcryptjs';

const initialAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

// Default data — used ONLY when MongoDB has no documents yet (first-ever boot).
// After that, all data comes from MongoDB Atlas.
export const DEFAULT_DATA = {
  adminCredentials: {
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: bcrypt.hashSync(initialAdminPass, 10),
  },
  profile: {
    eyebrow: 'WEB DEVELOPER & AI BUILDER',
    title1: 'CODE',
    titleAccent: 'IN THE',
    title2: 'SHADOWS',
    subtext:
      '3rd-Year Computer Science B.Tech student & Web Developer. I build clean web applications, integrate intelligent AI workflows, and solve complex DSA problems.',
    projectsShipped: '6+',
    yearsCoding: '3+',
    clientsServed: '100+',
    status: 'Available for Web Dev & Software Roles',
    statusDetail:
      'Focused on Web Development & AI Applications. Actively building projects with React, Node.js, Express, FastAPI, and LangGraph.',
    email: 'kumarharsh1851@gmail.com',
    pgpKey: 'github.com/harsh24239',
    linkedin: '',
    leetcode: '',
    twitter: '',
  },
  projects: [
    {
      _id: 'default_proj_1',
      title: 'AI Placement Copilot',
      tag: 'FastAPI — LangGraph — AI',
      description:
        'Agentic AI-powered placement preparation platform using LangGraph, FastAPI, React, and RAG vector retrieval with ChromaDB & Gemini embeddings.',
      year: '2026 (Ongoing)',
      link: 'https://github.com/harsh24239/ai-placement-copilot',
      iconText: 'AI',
      featured: true,
      sortOrder: 0,
    },
    {
      _id: 'default_proj_2',
      title: 'SQVS – Student Qualification Verification System',
      tag: 'React — Node.js — MySQL — DBMS',
      description:
        'Full-stack credential verification web application developed as a Database Systems project under Prof. Vikram Goyal. Features RBAC auth, analytics dashboards, audit logs, and RESTful Express APIs on a normalized MySQL schema.',
      year: '2026',
      link: 'https://github.com/harsh24239',
      iconText: 'SQ',
      featured: false,
      sortOrder: 1,
    },
    {
      _id: 'default_proj_3',
      title: 'University ERP System',
      tag: 'Java — Swing & JDBC — Systems',
      description:
        'Role-based desktop ERP application built in Java with a 4-layer architecture (UI, API, Service, DAO) under Prof. Sambuddho Chakravarty. Features BCrypt authentication, grade management, and JUnit unit tests.',
      year: '2025',
      link: 'https://github.com/harsh24239',
      iconText: 'UE',
      featured: false,
      sortOrder: 2,
    },
  ],
  skills: [
    { _id: 'default_skill_1', name: 'Languages & Core', desc: 'Python, Java, C/C++, JavaScript, SQL', pips: 5, iconType: 'frontend' },
    { _id: 'default_skill_2', name: 'Frontend Development', desc: 'React.js, Vite, HTML5, CSS3, Responsive Design Systems', pips: 5, iconType: 'backend' },
    { _id: 'default_skill_3', name: 'Backend & APIs', desc: 'Node.js, Express.js, FastAPI, RESTful APIs, Java JDBC', pips: 5, iconType: 'database' },
    { _id: 'default_skill_4', name: 'Databases & Storage', desc: 'MySQL (DBMS), ChromaDB (Vector DB), SQLite, Normalized Schemas', pips: 5, iconType: 'devops' },
    { _id: 'default_skill_5', name: 'AI & Agentic Workflows', desc: 'LangGraph, RAG Vector Retrieval, Gemini API, Multi-Agent Pipelines', pips: 5, iconType: 'security' },
    { _id: 'default_skill_6', name: 'CS Core & Security', desc: 'DSA (100+ Solved), OOP, BCrypt, JWT, RBAC Auth, JUnit Testing, Git/Linux', pips: 5, iconType: 'ai' },
  ],
  focusAreas: [
    { _id: 'default_fa_1', tag: 'DOMAIN 01', title: 'Web Application Development', desc: 'Designing and building scalable, responsive web apps using React, Node.js, Express, and modern database architectures.', sortOrder: 0 },
    { _id: 'default_fa_2', tag: 'DOMAIN 02', title: 'Agentic AI & RAG Workflows', desc: 'Developing intelligent workflows, multi-agent systems with LangGraph, and retrieval-augmented generation pipelines.', sortOrder: 1 },
    { _id: 'default_fa_3', tag: 'DOMAIN 03', title: 'Data Structures & Algorithms', desc: 'Strong foundation in computer science core principles, algorithmic problem solving, and software design patterns.', sortOrder: 2 },
    { _id: 'default_fa_4', tag: 'DOMAIN 04', title: 'Software Craft & Security', desc: 'Applying 4-layer system design, BCrypt password security, role-based access control (RBAC), and automated unit testing.', sortOrder: 3 },
  ],
  messages: [],
  testimonials: [],
};

// Live in-memory cache — always reflects the latest state from MongoDB.
// Do NOT read from or write to this directly in routes; use the helper below.
export const memoryStore = {
  adminCredentials: { ...DEFAULT_DATA.adminCredentials },
  profile: { ...DEFAULT_DATA.profile },
  projects: [...DEFAULT_DATA.projects],
  skills: [...DEFAULT_DATA.skills],
  focusAreas: [...DEFAULT_DATA.focusAreas],
  messages: [],
  testimonials: [],
};

// No-op kept for backward compatibility with any call sites that still import it.
// File-based persistence is intentionally removed — Render ephemeral disk is unreliable.
export const persistMemoryStore = () => {};
