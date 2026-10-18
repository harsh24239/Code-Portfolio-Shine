import './index.css';
import { lazy, Suspense, useState, useEffect, useRef, FormEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import PortfolioMotion from './components/portfolio/PortfolioMotion';
import useMotionState from './components/portfolio/useMotionState';
import './components/portfolio/interface-rich.css';
import './components/portfolio/motion-detail.css';
import './components/portfolio/projects.css';
import heroImg from '@assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg';

const API_BASE = import.meta.env.VITE_API_URL || '';
const HeroStage = lazy(() => import('./components/portfolio/HeroStage'));

const safeExternalUrl = (value: string | undefined, fallback = '#contact') => {
  if (!value) return fallback;
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.protocol === 'https:' ? url.toString() : fallback;
  } catch {
    return fallback;
  }
};

interface Project {
  _id?: string | number;
  id?: string | number;
  title: string;
  tag: string;
  description: string;
  year: string;
  link: string;
  iconText: string;
  featured: boolean;
  sortOrder: number;
}

interface Skill {
  _id?: string | number;
  id?: string | number;
  name: string;
  desc: string;
  pips: number;
  iconType?: string;
}

interface FocusArea {
  _id?: string | number;
  id?: string | number;
  tag: string;
  title: string;
  desc: string;
}

interface Tenet {
  num: string;
  title: string;
  text: string;
}

interface ProfileData {
  eyebrow: string;
  title1: string;
  titleAccent: string;
  title2: string;
  subtext: string;
  projectsShipped: string;
  yearsCoding: string;
  clientsServed: string;
  status: string;
  statusDetail: string;
  email: string;
  pgpKey: string;
  linkedin?: string;
  leetcode?: string;
  twitter?: string;
}

const DEFAULT_PROFILE: ProfileData = {
  eyebrow: 'WEB DEVELOPER & AI BUILDER',
  title1: 'CODE',
  titleAccent: 'IN THE',
  title2: 'SHADOWS',
  subtext: '3rd-Year Computer Science B.Tech student & Web Developer. I build clean web applications, integrate intelligent AI workflows, and solve complex DSA problems.',
  projectsShipped: '6+',
  yearsCoding: '3+',
  clientsServed: '100+',
  status: 'Available for Web Dev & Software Roles',
  statusDetail: 'Focused on Web Development & AI Applications. Actively building projects with React, Node.js, Express, FastAPI, and LangGraph.',
  email: 'kumarharsh1851@gmail.com',
  pgpKey: 'github.com/harsh24239',
  linkedin: '',
  leetcode: '',
  twitter: '',
};

const DEFAULT_PROJECTS: Project[] = [
  {
    _id: '1',
    title: 'AI Placement Copilot',
    tag: 'FastAPI — LangGraph — AI',
    description: 'A guided placement-prep workspace that routes questions through an agentic LangGraph workflow, retrieves grounded context, and returns focused practice through a React + FastAPI interface.',
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
    description: 'A full-stack credential verification platform that gives institutions role-based review flows, auditability, and operational visibility over student records.',
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
    description: 'A role-based university desktop system that centralizes academic workflows behind a four-layer Java architecture, secure authentication, and tested data access.',
    year: '2025',
    link: 'https://github.com/harsh24239',
    iconText: 'UE',
    featured: false,
    sortOrder: 2,
  },
];

const DEFAULT_SKILLS: Skill[] = [
  {
    _id: '1',
    name: 'Languages & Core',
    desc: 'Python, Java, C/C++, JavaScript, SQL',
    pips: 5,
    iconType: 'frontend',
  },
  {
    _id: '2',
    name: 'Frontend Development',
    desc: 'React.js, Vite, HTML5, CSS3, Responsive Design Systems',
    pips: 5,
    iconType: 'backend',
  },
  {
    _id: '3',
    name: 'Backend & APIs',
    desc: 'Node.js, Express.js, FastAPI, RESTful APIs, Java JDBC',
    pips: 5,
    iconType: 'database',
  },
  {
    _id: '4',
    name: 'Databases & Storage',
    desc: 'MySQL (DBMS), ChromaDB (Vector DB), SQLite, Normalized Schemas',
    pips: 5,
    iconType: 'devops',
  },
  {
    _id: '5',
    name: 'AI & Agentic Workflows',
    desc: 'LangGraph, RAG Vector Retrieval, Gemini API, Multi-Agent Pipelines',
    pips: 5,
    iconType: 'security',
  },
  {
    _id: '6',
    name: 'CS Core & Security',
    desc: 'DSA (100+ Solved), OOP, BCrypt, JWT, RBAC Auth, JUnit Testing, Git/Linux',
    pips: 5,
    iconType: 'ai',
  },
];

const DEFAULT_TENETS: Tenet[] = [
  { num: 'I', title: 'Precision Over Volume', text: 'One deliberate action outperforms a hundred frantic ones. Quality of execution is the only measure that matters.' },
  { num: 'II', title: 'Leave No Trace', text: 'Clean code. Clean contracts. Clean results. The footprint of a developer is maintainable software — nothing less.' },
  { num: 'III', title: 'Code Efficiency First', text: 'Optimal algorithms, clean data structures, and zero unnecessary overhead. Performance is a feature, not an afterthought.' },
  { num: 'IV', title: 'Adapt & Evolve', text: 'No rigid stack dogma. The situation and requirements define the solution — not preference.' },
];

const DEFAULT_FOCUS: FocusArea[] = [
  {
    _id: '1',
    tag: 'WEB DEVELOPMENT',
    title: 'Responsive Web Applications',
    desc: 'Building modern, clean, and responsive web interfaces using React.js, Vite, Node.js, Express.js, and RESTful APIs.',
  },
  {
    _id: '2',
    tag: 'AI & AUTOMATION',
    title: 'AI Workflows & RAG',
    desc: 'Integrating autonomous multi-agent pipelines using LangGraph, ChromaDB vector retrieval, RAG, and FastAPI.',
  },
  {
    _id: '3',
    tag: 'CORE CS & DSA',
    title: 'Algorithmic Problem Solving',
    desc: '3rd-Year Computer Science B.Tech student actively solving Data Structures and Algorithms problems in Python, Java, and C.',
  },
  {
    _id: '4',
    tag: 'SOFTWARE CRAFT',
    title: 'Clean Architecture & Security',
    desc: 'Applying 4-layer system design, MVC architecture, BCrypt password security, role-based access control (RBAC), and automated unit testing.',
  },
];

function renderSkillIcon(iconType?: string, index: number = 0) {
  const type = iconType || ['frontend', 'ai', 'backend', 'database', 'security', 'devops'][index % 6];
  
  switch (type) {
    case 'frontend':
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <path d="M6 30 L18 6 L30 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="10" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="18" cy="13" r="2" fill="currentColor" />
        </svg>
      );
    case 'backend':
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <rect x="4" y="8" width="28" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <polyline points="4,22 12,14 18,20 24,12 32,22" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="26" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'database':
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <polyline points="12,10 4,18 12,26" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <polyline points="24,10 32,18 24,26" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="20" y1="8" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'devops':
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
          <line x1="18" y1="6" x2="18" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="6" y1="18" x2="30" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      );
    case 'security':
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <rect x="8" y="8" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M13 18 L16 21 L23 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'ai':
    default:
      return (
        <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
          <ellipse cx="18" cy="10" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 10 L8 18 Q8 22 18 22 Q28 22 28 18 L28 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M8 18 L8 26 Q8 30 18 30 Q28 30 28 26 L28 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
}

type ProjectKind = 'ai' | 'data' | 'systems';

function getProjectPresentation(project: Project): { kind: ProjectKind; kindLabel: string; signal: string } {
  const searchable = `${project.title} ${project.tag} ${project.description}`.toLowerCase();

  if (/langgraph|fastapi|rag|agentic|ai/.test(searchable)) {
    return { kind: 'ai', kindLabel: 'Agentic AI', signal: 'RAG / ORCHESTRATION' };
  }

  if (/mysql|dbms|database|verification|sql|audit/.test(searchable)) {
    return { kind: 'data', kindLabel: 'Data platform', signal: 'RBAC / AUDIT TRAIL' };
  }

  return { kind: 'systems', kindLabel: 'Desktop systems', signal: '4-LAYER ARCHITECTURE' };
}

function renderProjectVisual(kind: ProjectKind) {
  if (kind === 'ai') {
    return (
      <div className="project-signal project-signal-ai">
        <div className="signal-grid" />
        <div className="signal-ai-flow">
          <span>ASK</span><i aria-hidden="true" />
          <span>RETRIEVE</span><i aria-hidden="true" />
          <span>RESPOND</span>
        </div>
        <div className="signal-orbit signal-orbit-one" />
        <div className="signal-orbit signal-orbit-two" />
      </div>
    );
  }

  if (kind === 'data') {
    return (
      <div className="project-signal project-signal-data">
        <div className="signal-dashboard-head"><span /> <span /> <span /></div>
        <div className="signal-dashboard-main">
          <div className="signal-chart"><i /><i /><i /><i /><i /></div>
          <div className="signal-table"><span /><span /><span /><span /></div>
        </div>
        <div className="signal-dashboard-footer"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <div className="project-signal project-signal-systems">
      <div className="signal-stack"><span>UI</span><span>SERVICE</span><span>DAO</span></div>
      <div className="signal-stack-line signal-stack-line-one" />
      <div className="signal-stack-line signal-stack-line-two" />
      <span className="signal-stack-caption">SECURE DATA FLOW</span>
    </div>
  );
}

function ProjectCard({ project, index, isFeatured = false }: { project: Project; index: number; isFeatured?: boolean }) {
  const titleId = `project-title-${index}`;
  const presentation = getProjectPresentation(project);
  const projectUrl = safeExternalUrl(project.link);
  const linkLabel = !project.link ? 'Start a conversation' : /github\.com\/[^/]+\/[^/]+/i.test(project.link) ? 'View source' : 'Open GitHub';
  const statusLabel = /ongoing/i.test(project.year) ? 'In progress' : 'Completed';

  return (
    <article className={`project-card project-card-${presentation.kind}${isFeatured ? ' project-card-featured' : ''}`} aria-labelledby={titleId}>
      <a className="project-card-link" href={projectUrl} target={projectUrl.startsWith('https://') ? '_blank' : undefined} rel={projectUrl.startsWith('https://') ? 'noreferrer' : undefined} aria-label={`Open ${project.title}`}>
        <div className="project-card-image" aria-hidden="true">
          <span className="project-cover-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="project-cover-label">{isFeatured ? 'Featured build' : presentation.kindLabel}</span>
          <span className="project-cover-corner">↗</span>
          {renderProjectVisual(presentation.kind)}
        </div>
        <div className="project-card-body">
          <div className="project-card-kicker">
            <p className="project-tag">{project.tag}</p>
            <span className="project-status">{statusLabel}</span>
          </div>
          <h3 className="project-title" id={titleId}>{project.title}</h3>
          <p className="project-desc">{project.description}</p>
          <div className="project-proof" aria-label={`Project focus: ${presentation.signal}`}>
            <span className="project-proof-label">Built around</span>
            <span>{presentation.signal}</span>
          </div>
          <div className="project-footer">
            <span className="project-year">{project.year}</span>
            <span className="project-link">{linkLabel}<span aria-hidden="true">↗</span></span>
          </div>
        </div>
      </a>
    </article>
  );
}

export default function App() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(DEFAULT_FOCUS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { enabled: motionEnabled, reduced: reducedMotion, toggle: toggleMotion } = useMotionState();
  const [heroEnhancementReady, setHeroEnhancementReady] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    const pointer = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 641px)');
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      if (!motionEnabled || !pointer.matches) {
        setHeroEnhancementReady(false);
        return;
      }
      // Let the native portrait and hero typography paint before downloading WebGL.
      timer = window.setTimeout(() => setHeroEnhancementReady(true), 650);
    };

    schedule();
    pointer.addEventListener('change', schedule);
    return () => {
      window.clearTimeout(timer);
      pointer.removeEventListener('change', schedule);
    };
  }, [motionEnabled]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const drawer = mobileDrawerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = drawer
      ? Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      : [];
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        return;
      }
      if (event.key !== 'Tab' || focusable.length < 2) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    fetch(`${API_BASE}/api/portfolio`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.profile) setProfile(data.profile);
        if (Array.isArray(data.projects) && data.projects.length > 0) setProjects(data.projects);
        if (Array.isArray(data.skills) && data.skills.length > 0) setSkills(data.skills);
        if (Array.isArray(data.focusAreas) && data.focusAreas.length > 0) setFocusAreas(data.focusAreas);
      })
      .catch(() => {/* Keep fallbacks */});
  }, []);

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Complete your name, email, and message before transmitting.');
      setContactStatus('error');
      return;
    }
    setContactError('');
    setContactStatus('sending');

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      });

      if (res.ok) {
        setContactStatus('success');
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
        setContactError('');
        setTimeout(() => setContactStatus('idle'), 5000);
      } else {
        setContactError(`Transmission failed. Please email directly to ${profile.email}.`);
        setContactStatus('error');
      }
    } catch {
      setContactError(`Transmission failed. Please email directly to ${profile.email}.`);
      setContactStatus('error');
    }
  };

  const getItemId = (item: { _id?: string | number; id?: string | number }) => item._id ?? item.id;
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const rest = projects.filter((p) => p !== featured);
  const orderedProjects = featured ? [featured, ...rest] : projects;
  return (
    <>
      <PortfolioMotion enabled={motionEnabled} />
      {/* NAV */}
      <nav aria-label="Primary navigation">
        <div className="container">
          <div className="nav-inner">
            <a className="nav-logo" href="#">HARSH.DEV</a>
            <nav className="nav-desktop" aria-label="Desktop navigation">
              <ul className="nav-links">
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#philosophy">Approach</a></li>
                <li><a href="#about">Focus</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <div className="nav-actions-right">
              <a className="nav-cta" href="#contact">Hire Me</a>
              <button
                ref={menuButtonRef}
                className="mobile-menu-toggle"
                aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileNavOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="mobile-nav-overlay" role="presentation" onClick={() => setMobileNavOpen(false)}>
            <div
              ref={mobileDrawerRef}
              id="mobile-navigation"
              className="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-navigation-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="mobile-navigation-title" className="sr-only">Navigation menu</h2>
              <ul className="mobile-nav-links">
                <li><a href="#skills" onClick={() => setMobileNavOpen(false)}>Skills</a></li>
                <li><a href="#projects" onClick={() => setMobileNavOpen(false)}>Projects</a></li>
                <li><a href="#philosophy" onClick={() => setMobileNavOpen(false)}>Approach</a></li>
                <li><a href="#about" onClick={() => setMobileNavOpen(false)}>Focus</a></li>
                <li><a href="#contact" onClick={() => setMobileNavOpen(false)}>Contact</a></li>
              </ul>
              <a className="btn-primary" href="#contact" onClick={() => setMobileNavOpen(false)} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                Hire Me →
              </a>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* HERO */}
        <header className="hero" aria-label="Hero">
          <div className="hero-bg-image" aria-hidden="true">
            <img src={heroImg} alt="" loading="eager" />
          </div>
          <Suspense fallback={null}>{heroEnhancementReady && <HeroStage enabled={motionEnabled} />}</Suspense>

          <div className="container">
            <div className="hero-text">
              <p className="hero-eyebrow">
                <span className="eyebrow-line" />
                {profile.eyebrow}
              </p>
              <h1 className="hero-title-main">
                <span className="hero-title-code hero-title-block">{profile.title1}</span>
                <span className="hero-title-accent hero-title-block">{profile.titleAccent}</span>
                <span className="hero-title-nowrap hero-title-block">{profile.title2}</span>
              </h1>
              <p className="hero-sub">{profile.subtext}</p>
              <div className="hero-actions">
                <a className="btn-primary" href="#projects">View Projects</a>
                <a className="btn-ghost" href="#contact">Hire Me</a>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-value">{profile.projectsShipped.replace('+', '')}<span>+</span></div>
                  <div className="hero-stat-label">Projects Shipped</div>
                </div>
                <div>
                  <div className="hero-stat-value">{profile.yearsCoding.replace('+', '')}<span>+</span></div>
                  <div className="hero-stat-label">Years Coding</div>
                </div>
                <div>
                  <div className="hero-stat-value">{profile.clientsServed.replace('+', '')}<span>+</span></div>
                  <div className="hero-stat-label">DSA Solved</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-scroll-hint" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <polyline points="2,5 7,10 12,5" fill="none" stroke="#4a4040" strokeWidth="1.5" />
            </svg>
            Scroll
          </div>
          {heroEnhancementReady && (
            <div className="hero-interaction-note" aria-hidden="true">
              <span>01</span> Hover portrait to decode
            </div>
          )}
        </header>

        {/* SKILLS */}
        <section id="skills" aria-label="Skills">
          <div className="container">
            <div className="skills-layout">
              <div className="skills-heading-col">
                <p className="skills-eyebrow">SKILLS &amp; STACK</p>
                <h2>
                  THE <br />TECH <br />
                  <span style={{ color: 'rgb(194, 0, 0)', WebkitTextFillColor: 'rgb(194, 0, 0)' }}>ARSENAL</span>
                </h2>
                <p>Every tool mastered through real-world battle. From frontend finesse to backend fortresses — this is the stack that ships production-grade code.</p>
              </div>
              <div className="skills-grid">
                {skills.map((skill, index) => {
                  const fallback = DEFAULT_SKILLS[index % DEFAULT_SKILLS.length];
                  const title = skill.desc ? skill.name : fallback.name;
                  const description = skill.desc ? skill.desc : skill.name;
                  const pips = skill.pips || 5;

                  return (
                    <div className="skill-item" key={String(getItemId(skill) || index)}>
                      {renderSkillIcon(skill.iconType, index)}
                      <div className="skill-name">{title}</div>
                      <p className="skill-desc">{description}</p>
                      <div className="skill-rank" aria-label={`Mastery level ${pips} of 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`skill-rank-pip${i < pips ? ' filled' : ''}`} />
                        ))}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" aria-label="Projects">
          <div className="container">
            <div className="projects-header">
              <div>
                <p className="projects-eyebrow">Selected Projects</p>
                <h2>THE<br />DOSSIER</h2>
              </div>
              <div className="projects-header-aside">
                <p>{projects.length || 'A small set of'} {projects.length === 1 ? 'system' : 'systems'}. Different constraints. One standard: make the work useful, legible, and built to hold up under scrutiny.</p>
                <span className="projects-header-meta">{projects.length} builds <span aria-hidden="true">·</span> {projects.length ? `${Math.min(...projects.map((project) => Number.parseInt(project.year, 10) || new Date().getFullYear()))} — ${Math.max(...projects.map((project) => Number.parseInt(project.year, 10) || new Date().getFullYear()))}` : 'Selected work'}</span>
              </div>
            </div>
            <div className="projects-grid" id="project-list">
              {orderedProjects.map((project, index) => <ProjectCard key={String(getItemId(project) || project.title)} project={project} index={index} isFeatured={project === featured} />)}
            </div>
          </div>
        </section>

        {/* PHILOSOPHY / ABOUT CODE */}
        <section id="philosophy" aria-label="Approach">
          <div className="philosophy-stripe" aria-hidden="true" />
          <div className="container">
            <div className="philosophy-layout">
              <div className="philosophy-text-col">
                <p className="philosophy-eyebrow">The Code</p>
                <h2>HOW THE<br />SHADOW<br />OPERATES</h2>
                <blockquote className="philosophy-quote">
                  "Mastery is not speed.<br />
                  It is the elimination<br />
                  of wasted motion."
                </blockquote>
                <p className="philosophy-body">Years of practice have produced one conclusion: every unnecessary element is a vulnerability. The strongest systems are not complex — they are ruthlessly refined.</p>
              </div>
              <div>
                <ul className="tenets-list">
                  {DEFAULT_TENETS.map((t) => (
                    <li className="tenet-item" key={t.num}>
                      <span className="tenet-marker">{t.num}</span>
                      <div>
                        <div className="tenet-title">{t.title}</div>
                        <p className="tenet-text">{t.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* BACKGROUND & FOCUS */}
        <section id="about" aria-label="Background & Focus">
          <div className="container">
            <p className="testimonials-eyebrow">BACKGROUND &amp; FOCUS</p>
            <h2 className="testimonials-heading">OPERATIONAL FOCUS</h2>
            <div className="skills-grid" style={{ marginTop: '2.5rem' }}>
              {focusAreas.map((f, i) => (
                <div className="skill-item" key={String(getItemId(f) || i)} style={{ padding: '2.25rem 1.75rem' }}>
                  <div className="project-tag" style={{ marginBottom: '0.75rem' }}>{f.tag}</div>
                  <div className="skill-name" style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>{f.title}</div>
                  <p className="skill-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" aria-label="Contact">
          <div className="contact-bg-kanji" aria-hidden="true">影</div>
          <div className="container">
            <div className="contact-layout">
              <div>
                <p className="contact-eyebrow">CONTACT</p>
                <h2 className="contact-heading">OPEN A<br />CHANNEL</h2>
                <p className="contact-intro">Engagements are accepted by referral or direct contact. Every conversation is handled with care and discretion. Response within 24 hours.</p>
                <div className="contact-channels">
                  {profile.email && (
                    <a className="contact-channel" href={`mailto:${profile.email}`}>
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 6L12 13L2 6" />
                      </svg>
                      <span className="contact-channel-label">DIRECT EMAIL</span>
                      <span className="contact-channel-detail">{profile.email}</span>
                    </a>
                  )}

                  {profile.pgpKey && (
                    <a className="contact-channel" href={safeExternalUrl(profile.pgpKey, '#contact')} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      <span className="contact-channel-label">GITHUB PROFILE</span>
                      <span className="contact-channel-detail">{profile.pgpKey.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.linkedin && (
                    <a className="contact-channel" href={safeExternalUrl(profile.linkedin, '#contact')} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                      <span className="contact-channel-label">LINKEDIN PROFILE</span>
                      <span className="contact-channel-detail">{profile.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.leetcode && (
                    <a className="contact-channel" href={safeExternalUrl(profile.leetcode, '#contact')} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                        <line x1="14" y1="4" x2="10" y2="20" />
                      </svg>
                      <span className="contact-channel-label">LEETCODE PROFILE</span>
                      <span className="contact-channel-detail">{profile.leetcode.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.twitter && (
                    <a className="contact-channel" href={safeExternalUrl(profile.twitter, '#contact')} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                      </svg>
                      <span className="contact-channel-label">TWITTER / X</span>
                      <span className="contact-channel-detail">{profile.twitter.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="contact-right-stack">
                <div className="contact-availability">
                  <div className="contact-avail-label">
                    <span className="contact-avail-dot" aria-hidden="true" />
                    CURRENT STATUS
                  </div>
                  <div className="contact-avail-status">{profile.status}</div>
                  <p className="contact-avail-detail">{profile.statusDetail}</p>
                </div>

                <form onSubmit={handleContactSubmit} aria-label="Contact form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="contact-inputs-row">
                    <label className="sr-only" htmlFor="contact-name">Your name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="YOUR NAME"
                      aria-label="Your name"
                      autoComplete="name"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        padding: '0.875rem 1rem',
                        fontFamily: 'inherit',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                    <label className="sr-only" htmlFor="contact-email">Your email</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="YOUR EMAIL"
                      aria-label="Your email"
                      autoComplete="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        padding: '0.875rem 1rem',
                        fontFamily: 'inherit',
                        fontSize: 'var(--text-sm)',
                      }}
                    />
                  </div>
                  <label className="sr-only" htmlFor="contact-subject">Subject or inquiry</label>
                  <input
                    id="contact-subject"
                    type="text"
                    placeholder="SUBJECT / INQUIRY"
                    aria-label="Subject or inquiry"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0.875rem 1rem',
                      fontFamily: 'inherit',
                      fontSize: 'var(--text-sm)',
                    }}
                  />
                  <label className="sr-only" htmlFor="contact-message">Your message</label>
                  <textarea
                    id="contact-message"
                    placeholder="YOUR TRANSMISSION MESSAGE..."
                    aria-label="Your message"
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0.875rem 1rem',
                      fontFamily: 'inherit',
                      fontSize: 'var(--text-sm)',
                      resize: 'vertical',
                    }}
                  />

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={contactStatus === 'sending'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {contactStatus === 'sending' ? 'TRANSMITTING...' : 'TRANSMIT SIGNAL →'}
                  </button>

                  {contactStatus === 'success' && (
                    <p role="status" aria-live="polite" style={{ color: '#40ff80', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                      ✓ Signal transmitted successfully! Check your inbox soon.
                    </p>
                  )}
                  {contactStatus === 'error' && (
                    <p role="alert" aria-live="assertive" style={{ color: '#ff6060', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                      ⚠ {contactError}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <a className="footer-logo" href="#">HARSH.DEV</a>
              <p className="footer-tagline">3rd-Year B.Tech student &amp; Web Developer crafting resilient applications and AI tools.</p>
            </div>
            <div>
              <div className="footer-col-heading">Navigation</div>
              <ul className="footer-nav-list">
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#philosophy">Approach</a></li>
                <li><a href="#about">Focus</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-heading">System Specs</div>
              <ul className="footer-nav-list">
                <li><span style={{ color: 'var(--fg)' }}>Tech: React + Node.js + FastAPI</span></li>
                <li><span style={{ color: 'var(--fg)' }}>Status: Operational</span></li>
                <li><span style={{ color: 'var(--fg)' }}>Location: India</span></li>
              </ul>
            </div>
          </div>
          <hr className="footer-divider" />
          <div className="footer-bottom">
            <div className="footer-legal">© {new Date().getFullYear()} HARSH KUMAR. ALL RIGHTS RESERVED.</div>
            <button type="button" className="footer-motion" aria-label={motionEnabled ? 'Pause motion' : 'Enable motion'} aria-pressed={motionEnabled} disabled={reducedMotion} title={reducedMotion ? 'System reduced motion is enabled' : undefined} onClick={toggleMotion}>{motionEnabled ? <Pause size={11} /> : <Play size={11} />}<span>{reducedMotion ? 'Reduced motion' : motionEnabled ? 'Motion on' : 'Motion off'}</span></button>
            <div className="footer-mark">影</div>
          </div>
        </div>
      </footer>
    </>
  );
}
