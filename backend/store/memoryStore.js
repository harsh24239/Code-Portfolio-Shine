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
      title: 'SQVS – Student Qualification Verification System',
      tag: 'React — Node.js — MySQL — DBMS',
      description: 'Full-stack credential verification web application developed as a Database Systems project under Prof. Vikram Goyal. Features RBAC auth, analytics dashboards, audit logs, and RESTful Express APIs on a normalized MySQL schema.',
      year: '2026',
      link: 'https://github.com/harsh24239',
      iconText: 'SQ',
      featured: false,
      sortOrder: 1,
    },
    {
      _id: '3',
      title: 'University ERP System',
      tag: 'Java — Swing & JDBC — Systems',
      description: 'Role-based desktop ERP application built in Java with a 4-layer architecture (UI, API, Service, DAO) under Prof. Sambuddho Chakravarty. Features BCrypt authentication, grade management, and JUnit unit tests.',
      year: '2025',
      link: 'https://github.com/harsh24239',
      iconText: 'UE',
      featured: false,
      sortOrder: 2,
    },
  ],
  skills: [
    { _id: '1', category: 'Languages', name: 'Python, Java, C/C++, JavaScript, TypeScript, SQL', level: 'Advanced' },
    { _id: '2', category: 'Frontend', name: 'React.js, Vite, HTML5, CSS3, Vanilla CSS Design Systems', level: 'Advanced' },
    { _id: '3', category: 'Backend', name: 'Node.js, Express.js, FastAPI, Java Swing & JDBC', level: 'Advanced' },
    { _id: '4', category: 'Databases', name: 'MySQL (DBMS), ChromaDB (Vector DB), MongoDB, SQLite', level: 'Advanced' },
    { _id: '5', category: 'AI & Automation', name: 'LangGraph, RAG Vector Retrieval, Gemini API, Multi-Agent Workflows', level: 'Proficient' },
    { _id: '6', category: 'CS Core & Security', name: 'DSA (500+ Solved), BCrypt, JWT, RBAC Auth, JUnit Testing, Git/Linux', level: 'Advanced' },
  ],
  focusAreas: [
    { _id: '1', tag: 'DOMAIN 01', title: 'Web Application Development', desc: 'Designing and building scalable, responsive web apps using React, Node.js, Express, and modern database architectures.' },
    { _id: '2', tag: 'DOMAIN 02', title: 'Agentic AI & RAG Workflows', desc: 'Developing intelligent workflows, multi-agent systems with LangGraph, and retrieval-augmented generation pipelines.' },
    { _id: '3', tag: 'DOMAIN 03', title: 'Data Structures & Algorithms', desc: 'Strong foundation in computer science core principles, algorithmic problem solving, and software design patterns.' },
    { _id: '4', tag: 'DOMAIN 04', title: 'Software Craft & Security', desc: 'Applying 4-layer system design, BCrypt password security, role-based access control (RBAC), and automated unit testing.' },
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
