import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'backend', 'store', 'user_data.json');

const defaultData = {
  profile: {
    eyebrow: 'WEB DEVELOPER & AI BUILDER',
    title1: 'CODE',
    titleAccent: 'IN THE',
    title2: 'SHADOWS',
    subtext: '3rd-Year Computer Science B.Tech student & Web Developer. I build clean web applications, integrate intelligent AI workflows, and solve complex DSA problems.',
    projectsShipped: '6+',
    yearsCoding: '3+',
    clientsServed: '500+',
    status: 'Available for Web Dev & Software Roles',
    statusDetail: 'Focused on Web Development & AI Applications. Actively building projects with React, Node.js, Express, FastAPI, and LangGraph.',
    email: 'kumarharsh1851@gmail.com',
    pgpKey: 'github.com/harsh24239',
    linkedin: '',
    leetcode: '',
    twitter: '',
  },
  projects: [
    {
      _id: '1',
      title: 'AI Placement Copilot',
      tag: 'FastAPI — LangGraph — AI',
      description: 'Agentic AI-powered placement preparation platform using LangGraph, FastAPI, React, and RAG vector retrieval with ChromaDB & Gemini embeddings.',
      year: '2026 (Ongoing)',
      link: 'https://github.com/harsh24239/ai-placement-copilot',
      iconText: 'AI',
      featured: true,
      sortOrder: 0,
    },
    {
      _id: '2',
      title: 'VR Manual Milling Simulator',
      tag: 'Unity / C# — VR Simulation',
      description: 'VR manual milling trainer prototype — Blender + Unity/C# simulation with force-based haptic feedback. Research-aligned XR hardware/software project.',
      year: '2026 (In Progress)',
      link: 'https://github.com/harsh24239/vr-manual-milling-simulator',
      iconText: 'VR',
      featured: false,
      sortOrder: 1,
    },
    {
      _id: '3',
      title: 'SQVS – Student Qualification Verification',
      tag: 'React — Node.js — MySQL — DBMS',
      description: 'Full-stack credential verification web application developed as a Database Systems project. Features RBAC auth, analytics dashboards, audit logs, and RESTful Express APIs on a normalized MySQL schema.',
      year: '2026',
      link: 'https://github.com/harsh24239',
      iconText: 'SQ',
      featured: false,
      sortOrder: 2,
    },
    {
      _id: '4',
      title: 'University ERP System',
      tag: 'Java — Swing & JDBC — Systems',
      description: 'Desktop ERP application for university course registration, grade tracking, and fee management built with Java Swing and JDBC.',
      year: '2025',
      link: 'https://github.com/harsh24239',
      iconText: 'ERP',
      featured: false,
      sortOrder: 3,
    },
  ],
  skills: [
    { _id: '1', category: 'Languages', name: 'JavaScript / TypeScript', level: 'Advanced' },
    { _id: '2', category: 'Languages', name: 'Python', level: 'Advanced' },
    { _id: '3', category: 'Languages', name: 'C++', level: 'Proficient' },
    { _id: '4', category: 'Frontend', name: 'React & Vite', level: 'Advanced' },
    { _id: '5', category: 'Backend', name: 'Node.js & Express', level: 'Advanced' },
    { _id: '6', category: 'Backend', name: 'FastAPI & Python Web', level: 'Proficient' },
    { _id: '7', category: 'Databases', name: 'MongoDB & MySQL', level: 'Proficient' },
    { _id: '8', category: 'AI & ML', name: 'LangGraph & RAG Systems', level: 'Proficient' },
  ],
  focusAreas: [
    { _id: '1', tag: 'DOMAIN 01', title: 'Web Application Development', desc: 'Designing and building scalable, responsive web apps using React, Node.js, Express, and modern database architectures.' },
    { _id: '2', tag: 'DOMAIN 02', title: 'Agentic AI & RAG Workflows', desc: 'Developing intelligent workflows, multi-agent systems with LangGraph, and retrieval-augmented generation pipelines.' },
    { _id: '3', tag: 'DOMAIN 03', title: 'Data Structures & Algorithms', desc: 'Strong foundation in computer science core principles, algorithmic problem solving, and software design patterns.' },
  ],
};

const loadInitialData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      console.log('✓ Persistent user data loaded successfully from user_data.json');
      return {
        profile: { ...defaultData.profile, ...(loaded.profile || {}) },
        projects: loaded.projects && loaded.projects.length > 0 ? loaded.projects : defaultData.projects,
        skills: loaded.skills && loaded.skills.length > 0 ? loaded.skills : defaultData.skills,
        focusAreas: loaded.focusAreas && loaded.focusAreas.length > 0 ? loaded.focusAreas : defaultData.focusAreas,
      };
    }
  } catch (err) {
    console.warn('⚠ Could not read user_data.json file, using defaults:', err.message);
  }
  return defaultData;
};

export const memoryStore = loadInitialData();

export const persistMemoryStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
    console.log('✓ Persistent user data saved to user_data.json');
  } catch (err) {
    console.error('⚠ Failed to persist memoryStore:', err.message);
  }
};
