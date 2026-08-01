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
    { _id: '1', name: 'Frontend Mastery', desc: 'React, Next.js, TypeScript, Tailwind CSS. Pixel-perfect UIs that load fast and feel alive.', pips: 5, iconType: 'frontend' },
    { _id: '2', name: 'Backend Engineering', desc: 'Node.js, Python, Go, REST & GraphQL APIs. Scalable server architecture built to endure.', pips: 5, iconType: 'backend' },
    { _id: '3', name: 'Database & Cloud', desc: 'PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes. Infrastructure that never sleeps.', pips: 4, iconType: 'database' },
    { _id: '4', name: 'DevOps & CI/CD', desc: 'GitHub Actions, Jenkins, Terraform, Linux. Automated pipelines that deploy without hesitation.', pips: 4, iconType: 'devops' },
    { _id: '5', name: 'Security & Auth', desc: 'OAuth2, JWT, penetration testing, OWASP hardening. Code that guards itself like a fortress.', pips: 5, iconType: 'security' },
    { _id: '6', name: 'AI & Automation', desc: 'LLM integration, Python automation, web scraping, data pipelines. Machines that work while you sleep.', pips: 4, iconType: 'ai' },
  ],
  focusAreas: [
    { _id: '1', tag: 'DOMAIN 01', title: 'Web Application Development', desc: 'Designing and building scalable, responsive web apps using React, Node.js, Express, and modern database architectures.' },
    { _id: '2', tag: 'DOMAIN 02', title: 'Agentic AI & RAG Workflows', desc: 'Developing intelligent workflows, multi-agent systems with LangGraph, and retrieval-augmented generation pipelines.' },
    { _id: '3', tag: 'DOMAIN 03', title: 'Data Structures & Algorithms', desc: 'Strong foundation in computer science core principles, algorithmic problem solving, and software design patterns.' },
    { _id: '4', tag: 'DOMAIN 04', title: 'Software Craft & Security', desc: 'Applying 4-layer system design, BCrypt password security, role-based access control (RBAC), and automated unit testing.' },
  ],
  messages: [],
  testimonials: [],
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
        skills: (loaded.skills && loaded.skills.length > 0 && loaded.skills[0].pips !== undefined) ? loaded.skills : defaultData.skills,
        focusAreas: loaded.focusAreas && loaded.focusAreas.length > 0 ? loaded.focusAreas : defaultData.focusAreas,
        messages: Array.isArray(loaded.messages) ? loaded.messages : [],
        testimonials: Array.isArray(loaded.testimonials) ? loaded.testimonials : [],
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
