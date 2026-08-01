import './index.css';
import { useState, useEffect, FormEvent } from 'react';
import heroImg from '@assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  projectsShipped: '15+',
  yearsCoding: '3+',
  clientsServed: '500+',
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
    title: 'SQVS – Qualification Verification',
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
    description: 'Role-based desktop ERP application built in Java with a 4-layer architecture (UI, API, Service, DAO). Features BCrypt authentication, deadline-enforced grade management, and JUnit automated unit tests.',
    year: '2025',
    link: 'https://github.com/harsh24239',
    iconText: 'UE',
    featured: false,
    sortOrder: 3,
  },
];

const DEFAULT_SKILLS: Skill[] = [
  {
    _id: '1',
    name: 'Web Development',
    desc: 'HTML5, CSS3, JavaScript, React.js, Vite, Node.js, Express.js. Building responsive web UIs & REST APIs.',
    pips: 5,
    iconType: 'frontend',
  },
  {
    _id: '2',
    name: 'AI & Automation',
    desc: 'LangGraph, FastAPI, ChromaDB, RAG Vector Retrieval, Gemini API, Multi-Agent Workflows.',
    pips: 5,
    iconType: 'ai',
  },
  {
    _id: '3',
    name: 'Core Languages & DSA',
    desc: 'Python, Java, C, SQL. Data Structures, Algorithms, Object-Oriented Programming (OOP).',
    pips: 5,
    iconType: 'backend',
  },
  {
    _id: '4',
    name: 'Database Systems',
    desc: 'MySQL, SQLite, SQLAlchemy, DBMS, Schema Normalization, Relational Modeling, JDBC.',
    pips: 4,
    iconType: 'database',
  },
  {
    _id: '5',
    name: 'Security & Testing',
    desc: 'RBAC Auth, BCrypt Password Hashing, JWT Tokens, JUnit Automated Unit Testing.',
    pips: 4,
    iconType: 'security',
  },
  {
    _id: '6',
    name: 'Developer Tools & OS',
    desc: 'Git, GitHub, Linux/Unix Shell, Postman, VS Code, IntelliJ IDEA, Operating Systems.',
    pips: 5,
    iconType: 'devops',
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

function ProjectCard({ project, featured }: { project: Project; featured?: boolean }) {
  return (
    <div className={`project-card${featured ? ' project-card-featured' : ''}`}>
      <div className="project-card-image">
        <div className="project-card-image-inner">
          <span className="project-card-image-icon">{project.iconText || project.title.slice(0, 2).toUpperCase()}</span>
        </div>
      </div>
      <div className="project-card-body">
        <p className="project-tag">{project.tag}</p>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-desc">{project.description}</p>
        <div className="project-footer">
          <span className="project-year">{project.year}</span>
          <a className="project-link" href={project.link || '#contact'} target={project.link ? '_blank' : undefined} rel="noreferrer">
            {featured ? 'View Project →' : (
              <>
                View Intel
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 10,6" stroke="currentColor" strokeWidth="1.5" />
                  <polyline points="7,3 10,6 7,9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </>
            )}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(DEFAULT_FOCUS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

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
    if (!contactName || !contactEmail || !contactMessage) return;
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
        setTimeout(() => setContactStatus('idle'), 5000);
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  };

  const getItemId = (item: { _id?: string | number; id?: string | number }) => item._id ?? item.id;
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const featuredId = featured ? getItemId(featured) : null;
  const rest = projects.filter((p) => getItemId(p) !== featuredId);

  return (
    <>
      {/* NAV */}
      <nav aria-label="Primary navigation">
        <div className="container">
          <div className="nav-inner">
            <a className="nav-logo" href="#">HARSH.DEV</a>
            <nav className="nav-desktop" aria-label="Desktop navigation">
              <ul className="nav-links">
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <div className="nav-actions-right">
              <a className="nav-cta" href="#contact">Hire Me</a>
              <button
                className="mobile-menu-toggle"
                aria-label="Toggle mobile menu"
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
          <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)}>
            <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
              <ul className="mobile-nav-links">
                <li><a href="#skills" onClick={() => setMobileNavOpen(false)}>Skills</a></li>
                <li><a href="#projects" onClick={() => setMobileNavOpen(false)}>Projects</a></li>
                <li><a href="#about" onClick={() => setMobileNavOpen(false)}>About</a></li>
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

          <div className="container">
            <div className="hero-text">
              <p className="hero-eyebrow">
                <span className="eyebrow-line" />
                {profile.eyebrow}
              </p>
              <h1 className="hero-title-main">
                <span className="hero-title-block">{profile.title1}</span>
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
        </header>

        {/* SKILLS */}
        <section id="skills" aria-label="Skills">
          <div className="container">
            <div className="skills-layout">
              <div className="skills-heading-col">
                <p className="skills-eyebrow">Skills &amp; Stack</p>
                <h2>
                  THE<br />TECH<br />
                  <span style={{ color: 'rgb(194, 0, 0)' }}>ARSENAL</span>
                </h2>
                <p>Every tool mastered through real-world practice. From frontend web interfaces to backend systems &amp; AI models.</p>
              </div>
              <div className="skills-grid">
                {skills.map((skill, index) => (
                  <div className="skill-item" key={String(getItemId(skill) || index)}>
                    {renderSkillIcon(skill.iconType, index)}
                    <div className="skill-name">{skill.name}</div>
                    <p className="skill-desc">{skill.desc}</p>
                    <div className="skill-rank" aria-label={`Mastery level ${skill.pips} of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={`skill-rank-pip${i < skill.pips ? ' filled' : ''}`} />
                      ))}
                    </div>
                  </div>
                ))}
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
              <span className="projects-header-meta">2024 — 2026</span>
            </div>
            <div className="projects-grid">
              {featured && <ProjectCard project={featured} featured />}
              {rest.map((p, index) => (
                <ProjectCard key={String(getItemId(p) || index)} project={p} />
              ))}
              
              {/* Upcoming Mission Placeholder Card when rest projects count is odd or total < 4 */}
              {rest.length < 3 && (
                <div className="project-card project-card-upcoming">
                  <div className="project-card-image">
                    <div className="project-card-image-inner">
                      <span className="project-card-image-icon" style={{ opacity: 0.35 }}>✦</span>
                    </div>
                  </div>
                  <div className="project-card-body">
                    <p className="project-tag" style={{ color: 'var(--muted)' }}>SHADOW LABS // UPCOMING</p>
                    <h3 className="project-title" style={{ opacity: 0.85 }}>Project In Development</h3>
                    <p className="project-desc" style={{ color: 'var(--muted)' }}>
                      New AI &amp; Web development project currently brewing in the shadows. Check back soon for deployment.
                    </p>
                    <div className="project-footer">
                      <span className="project-year">2026</span>
                      <a className="project-link" href="#contact" style={{ opacity: 0.7 }}>
                        Propose Idea →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PHILOSOPHY / ABOUT CODE */}
        <section id="philosophy" aria-label="Code of the Shadow">
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
                <p className="contact-eyebrow">Initiate Contact</p>
                <h2 className="contact-heading">TRANSMIT A<br />MESSAGE</h2>
                <p className="contact-intro">Whether you have a web project, an AI concept, or an opportunity — transmit your signal directly below.</p>
                <div className="contact-channels">
                  {profile.email && (
                    <a className="contact-channel" href={`mailto:${profile.email}`}>
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 6L12 13L2 6" />
                      </svg>
                      <span className="contact-channel-label">Direct Email</span>
                      <span className="contact-channel-detail">{profile.email}</span>
                    </a>
                  )}

                  {profile.pgpKey && (
                    <a className="contact-channel" href={profile.pgpKey.startsWith('http') ? profile.pgpKey : `https://${profile.pgpKey}`} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      <span className="contact-channel-label">GitHub Profile</span>
                      <span className="contact-channel-detail">{profile.pgpKey.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.linkedin && (
                    <a className="contact-channel" href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                      <span className="contact-channel-label">LinkedIn Profile</span>
                      <span className="contact-channel-detail">{profile.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.leetcode && (
                    <a className="contact-channel" href={profile.leetcode.startsWith('http') ? profile.leetcode : `https://${profile.leetcode}`} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                        <line x1="14" y1="4" x2="10" y2="20" />
                      </svg>
                      <span className="contact-channel-label">LeetCode Profile</span>
                      <span className="contact-channel-detail">{profile.leetcode.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}

                  {profile.twitter && (
                    <a className="contact-channel" href={profile.twitter.startsWith('http') ? profile.twitter : `https://${profile.twitter}`} target="_blank" rel="noreferrer">
                      <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                      </svg>
                      <span className="contact-channel-label">Twitter / X</span>
                      <span className="contact-channel-detail">{profile.twitter.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="contact-right-stack">
                <div className="contact-availability">
                  <div className="contact-avail-label">OPERATIONAL STATUS</div>
                  <div className="contact-avail-status">{profile.status}</div>
                  <p className="contact-avail-detail">{profile.statusDetail}</p>
                </div>

                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="contact-inputs-row">
                    <input
                      type="text"
                      placeholder="YOUR NAME"
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
                    <input
                      type="email"
                      placeholder="YOUR EMAIL"
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
                  <input
                    type="text"
                    placeholder="SUBJECT / INQUIRY"
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
                  <textarea
                    placeholder="YOUR TRANSMISSION MESSAGE..."
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
                    <p style={{ color: '#40ff80', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                      ✓ Signal transmitted successfully! Check your inbox soon.
                    </p>
                  )}
                  {contactStatus === 'error' && (
                    <p style={{ color: '#ff6060', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                      ⚠ Transmission failed. Please email directly to kumarharsh1851@gmail.com
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
                <li><a href="#about">About</a></li>
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
            <div className="footer-mark">影</div>
          </div>
        </div>
      </footer>
    </>
  );
}
