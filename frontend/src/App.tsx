import './index.css';
import { useState, useEffect, FormEvent } from 'react';
import heroImg from '@assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Project {
  id: string | number;
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
  id?: string | number;
  name: string;
  desc: string;
  pips: number;
}

interface FocusArea {
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
}

const DEFAULT_PROFILE: ProfileData = {
  eyebrow: 'Full-Stack Developer & Code Architect',
  title1: 'CODE',
  titleAccent: 'IN THE',
  title2: 'SHADOWS',
  subtext: 'Full-stack engineer & open-source developer. I build scalable backend systems, craft pixel-perfect interfaces, and write clean, high-performance code.',
  projectsShipped: '15+',
  yearsCoding: '3+',
  clientsServed: '500+',
  status: 'Open to Opportunities',
  statusDetail: 'Available for Full-Stack & Software Engineering roles. Focused on building high-performance web applications and backend systems.',
  email: 'kumarharsh1851@gmail.com',
  pgpKey: 'github.com/harsh24239',
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
    title: 'StealthAPI',
    tag: 'Go — Microservices',
    description: 'High-performance REST API gateway in Go handling 1M+ requests/day. Rate limiting, JWT auth, Redis caching, Kubernetes orchestration.',
    year: '2024',
    link: '',
    iconText: 'SA',
    featured: false,
    sortOrder: 3,
  },
];

const DEFAULT_SKILLS: Skill[] = [
  {
    name: 'Frontend Mastery',
    desc: 'React, Next.js, TypeScript, Tailwind CSS. Pixel-perfect UIs that load fast and feel alive.',
    pips: 5,
  },
  {
    name: 'Backend Engineering',
    desc: 'Node.js, Express, Python, REST & GraphQL APIs. Scalable server architecture built to endure.',
    pips: 5,
  },
  {
    name: 'Database & Cloud',
    desc: 'PostgreSQL, MongoDB, Redis, AWS, Docker. Data infrastructure built for speed.',
    pips: 4,
  },
  {
    name: 'DevOps & CI/CD',
    desc: 'GitHub Actions, Linux, Docker, Vercel, Render. Automated pipelines that deploy without friction.',
    pips: 4,
  },
  {
    name: 'Security & Auth',
    desc: 'OAuth2, JWT, bcrypt encryption, OWASP hardening. Code that guards itself like a fortress.',
    pips: 5,
  },
  {
    name: 'AI & Automation',
    desc: 'LLM API integration, Python automation, web scraping, data pipelines. Smart systems built for scale.',
    pips: 4,
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
    tag: 'SYSTEMS & BACKEND',
    title: 'Scalable Infrastructure',
    desc: 'Dedicated to building high-throughput backend services, RESTful APIs, database optimization, and microservices architecture.',
  },
  {
    tag: 'FULL-STACK & UI',
    title: 'Pixel-Perfect Interfaces',
    desc: 'Crafting modern, responsive, and high-performance user interfaces with React, Next.js, and TypeScript.',
  },
  {
    tag: 'DSA & CORE CS',
    title: 'Algorithmic Rigor',
    desc: 'Consistent problem solver focused on Data Structures, Algorithms, time/space complexity optimization, and software design principles.',
  },
  {
    tag: 'ACADEMIC & RESEARCH',
    title: 'Computer Science Foundation',
    desc: 'Strong foundation in Operating Systems, Database Management Systems (DBMS), Computer Networks, and Object-Oriented Design.',
  },
];

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

  const featured = projects.find((p) => p.featured) ?? projects[0];
  const rest = projects.filter((p) => p.id !== featured?.id);

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
              <p className="hero-eyebrow">{profile.eyebrow}</p>
              <h1>
                {profile.title1}<br />
                <span className="hero-title-accent">{profile.titleAccent}</span><br />
                {profile.title2}
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
                <p>Every tool mastered through real-world projects and problem solving. From frontend finesse to backend fortresses — this is the stack that ships production-grade code.</p>
              </div>
              <div className="skills-grid">
                {skills.map((skill, index) => (
                  <div className="skill-item" key={skill.name + index}>
                    <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                      <path d="M6 30 L18 6 L30 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <line x1="10" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="18" cy="13" r="2" fill="currentColor" />
                    </svg>
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
              {rest.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
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
                <div className="skill-item" key={f.title + i} style={{ padding: '2.25rem 1.75rem' }}>
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
                <p className="contact-eyebrow">Contact</p>
                <h2 className="contact-heading">OPEN A<br />CHANNEL</h2>
                <p className="contact-intro">Direct contact for collaboration, engineering roles, and open-source inquiries. All communications are encrypted. Response within 24 hours.</p>
                
                {/* Contact Direct Links */}
                <div className="contact-channels">
                  <a className="contact-channel" href={`mailto:${profile.email}`}>
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <polyline points="2,5 10,11 18,5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                    <span className="contact-channel-label">Email</span>
                    <span className="contact-channel-detail">{profile.email}</span>
                  </a>
                  <a className="contact-channel" href="https://github.com/harsh24239" target="_blank" rel="noreferrer">
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M6 14 Q10 6 14 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="10" cy="8" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="contact-channel-label">GitHub Protocol</span>
                    <span className="contact-channel-detail">harsh24239</span>
                  </a>
                  <div className="contact-channel">
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="8" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M7 8 L7 5 Q7 2 10 2 Q13 2 13 5 L13 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="contact-channel-label">Identity Profile</span>
                    <span className="contact-channel-detail">Harsh Kumar</span>
                  </div>
                </div>
              </div>

              <div className="contact-right-stack">
                <div className="contact-availability">
                  <div className="contact-avail-label">
                    <span className="contact-avail-dot" aria-hidden="true" />
                    Current Status
                  </div>
                  <div className="contact-avail-status">{profile.status}</div>
                  <p className="contact-avail-detail">{profile.statusDetail}</p>
                </div>

                {/* Direct Interactive Form */}
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="contact-inputs-row">
                    <input
                      type="text"
                      placeholder="YOUR NAME *"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: '0.8125rem',
                      }}
                    />
                    <input
                      type="email"
                      placeholder="YOUR EMAIL *"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.875rem 1rem',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontFamily: 'IBM Plex Mono, monospace',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="SUBJECT / MISSION TYPE"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <textarea
                    placeholder="TRANSMISSION DETAILS / MESSAGE *"
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '0.8125rem',
                      resize: 'vertical',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={contactStatus === 'sending'}
                    style={{ width: '100%', justifyContent: 'center', cursor: contactStatus === 'sending' ? 'wait' : 'pointer' }}
                  >
                    {contactStatus === 'sending' ? 'TRANSMITTING...' : 'SEND ENCRYPTED MESSAGE →'}
                  </button>

                  {contactStatus === 'success' && (
                    <div style={{ color: '#4ade80', fontSize: '0.8125rem', textAlign: 'center', marginTop: '0.5rem' }}>
                      ✓ Transmission received. Message logged in admin inbox.
                    </div>
                  )}
                  {contactStatus === 'error' && (
                    <div style={{ color: '#ff6060', fontSize: '0.8125rem', textAlign: 'center', marginTop: '0.5rem' }}>
                      ✕ Transmission failed. Please try direct email: {profile.email}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer" aria-label="Site footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <a className="footer-logo" href="#">
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <polygon points="14,2 26,10 26,18 14,26 2,18 2,10" fill="none" stroke="#c8001e" strokeWidth="1.5" />
                  <line x1="14" y1="2" x2="14" y2="26" stroke="#c8001e" strokeWidth="1" />
                  <line x1="2" y1="10" x2="26" y2="18" stroke="#c8001e" strokeWidth="1" />
                  <line x1="26" y1="10" x2="2" y2="18" stroke="#c8001e" strokeWidth="1" />
                  <circle cx="14" cy="14" r="2.5" fill="#c8001e" />
                </svg>
                HARSH
              </a>
              <p className="footer-tagline">A portfolio built for disciplines that require precision, efficiency, and exceptional software craft.</p>
            </div>
            <div>
              <p className="footer-col-heading">Navigate</p>
              <ul className="footer-nav-list">
                <li><a href="#skills">Disciplines</a></li>
                <li><a href="#projects">Missions</a></li>
                <li><a href="#philosophy">The Code</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="footer-col-heading">Protocol</p>
              <ul className="footer-nav-list">
                <li><a href="#contact">Open a Channel</a></li>
                <li><a href="https://github.com/harsh24239" target="_blank" rel="noreferrer">GitHub Profile</a></li>
                <li><a href={`mailto:${profile.email}`}>Email Contact</a></li>
              </ul>
            </div>
          </div>
          <hr className="footer-divider" aria-hidden="true" />
          <div className="footer-bottom">
            <p className="footer-legal">© 2026 Harsh Kumar. All rights reserved.</p>
            <span className="footer-mark" aria-hidden="true">影</span>
          </div>
        </div>
      </footer>
    </>
  );
}
