import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'backend', 'store', 'user_data.json');

const defaultData = {
  profile: {
    eyebrow: 'FULL-STACK DEVELOPER & CODE ARCHITECT',
    title1: 'CODE',
    titleAccent: 'IN THE',
    title2: 'SHADOWS',
    subtext: 'Full-stack engineer. Open-source contributor. I build scalable systems, craft pixel-perfect interfaces, and write code that runs silent and fast — like a shadow in the machine.',
    projectsShipped: '48+',
    yearsCoding: '9+',
    clientsServed: '31+',
    status: 'Taking Missions',
    statusDetail: 'Available for engagements beginning September 2026. Priority given to long-duration contracts requiring sustained operational focus.',
    email: 'shadow@kage.ops',
    pgpKey: '0xA4B7C9E1',
    linkedin: '',
    leetcode: '',
    twitter: '',
  },
  projects: [
    {
      _id: '1',
      title: 'ShadowBoard',
      tag: 'Full-Stack — SaaS',
      description: 'A real-time project management SaaS built with Next.js, Supabase, and WebSockets. 10K+ active users, 99.9% uptime, deployed on AWS with zero-downtime CI/CD pipeline.',
      year: '2025',
      link: '#contact',
      iconText: 'SB',
      featured: true,
      sortOrder: 0,
    },
    {
      _id: '2',
      title: 'KageUI',
      tag: 'React — TypeScript',
      description: 'Open-source component library with 40+ dark-themed UI components. 2.3K GitHub stars, full TypeScript support, Storybook docs.',
      year: '2025',
      link: '#contact',
      iconText: 'KU',
      featured: false,
      sortOrder: 1,
    },
    {
      _id: '3',
      title: 'NinjaBot',
      tag: 'Python — AI',
      description: 'LLM-powered code review bot that integrates with GitHub PRs. Catches bugs, suggests refactors, enforces style guides. 94% accuracy on test suite.',
      year: '2024',
      link: '#contact',
      iconText: 'NB',
      featured: false,
      sortOrder: 2,
    },
    {
      _id: '4',
      title: 'StealthAPI',
      tag: 'Go — Microservices',
      description: 'High-performance REST API gateway in Go handling 1M+ requests/day. Rate limiting, JWT auth, Redis caching, Kubernetes orchestration.',
      year: '2024',
      link: '#contact',
      iconText: 'SA',
      featured: false,
      sortOrder: 3,
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
