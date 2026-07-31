import './index.css';
import heroImg from '@assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg';

export default function App() {
  return (
    <>
      {/* NAV */}
      <nav aria-label="Primary navigation">
        <div className="container">
          <div className="nav-inner">
            <a className="nav-logo" href="#">KAGE.DEV</a>
            <nav className="nav-desktop" aria-label="Desktop navigation">
              <ul className="nav-links">
                <li><a href="#skills">Skills</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#philosophy">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <a className="nav-cta" href="#contact">Hire Me</a>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO — image as full background */}
        <header className="hero" aria-label="Hero">
          <div className="hero-bg-image" aria-hidden="true">
            <img
              src={heroImg}
              alt=""
              loading="eager"
            />
          </div>

          <div className="container">
            <div className="hero-text">
              <p className="hero-eyebrow">Full-Stack Developer &amp; Code Architect</p>
              <h1>
                CODE<br />
                <span className="hero-title-accent">IN THE</span><br />
                SHADOWS
              </h1>
              <p className="hero-sub">
                Full-stack engineer. Open-source contributor. I build scalable systems,
                craft pixel-perfect interfaces, and write code that runs silent and fast —
                like a shadow in the machine.
              </p>
              <div className="hero-actions">
                <a className="btn-primary" href="#projects">View Projects</a>
                <a className="btn-ghost" href="#contact">Hire Me</a>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-value">48<span>+</span></div>
                  <div className="hero-stat-label">Projects Shipped</div>
                </div>
                <div>
                  <div className="hero-stat-value">9<span>+</span></div>
                  <div className="hero-stat-label">Years Coding</div>
                </div>
                <div>
                  <div className="hero-stat-value">31<span>+</span></div>
                  <div className="hero-stat-label">Clients Served</div>
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
                <p>Every tool mastered through real-world battle. From frontend finesse to backend fortresses — this is the stack that ships production-grade code.</p>
              </div>
              <div className="skills-grid">
                {[
                  {
                    name: 'Frontend Mastery',
                    desc: 'React, Next.js, TypeScript, Tailwind CSS. Pixel-perfect UIs that load fast and feel alive.',
                    pips: 5,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <path d="M6 30 L18 6 L30 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <line x1="10" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="18" cy="13" r="2" fill="currentColor" />
                      </svg>
                    ),
                  },
                  {
                    name: 'Backend Engineering',
                    desc: 'Node.js, Python, Go, REST & GraphQL APIs. Scalable server architecture built to endure.',
                    pips: 5,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <rect x="4" y="8" width="28" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <polyline points="4,22 12,14 18,20 24,12 32,22" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <circle cx="26" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    ),
                  },
                  {
                    name: 'Database & Cloud',
                    desc: 'PostgreSQL, MongoDB, Redis, AWS, Docker, Kubernetes. Infrastructure that never sleeps.',
                    pips: 4,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <polyline points="12,10 4,18 12,26" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <polyline points="24,10 32,18 24,26" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <line x1="20" y1="8" x2="16" y2="28" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    ),
                  },
                  {
                    name: 'DevOps & CI/CD',
                    desc: 'GitHub Actions, Jenkins, Terraform, Linux. Automated pipelines that deploy without hesitation.',
                    pips: 4,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <circle cx="18" cy="18" r="2" fill="currentColor" />
                        <line x1="18" y1="6" x2="18" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                        <line x1="6" y1="18" x2="30" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                      </svg>
                    ),
                  },
                  {
                    name: 'Security & Auth',
                    desc: 'OAuth2, JWT, penetration testing, OWASP hardening. Code that guards itself like a fortress.',
                    pips: 5,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <rect x="8" y="8" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M13 18 L16 21 L23 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    ),
                  },
                  {
                    name: 'AI & Automation',
                    desc: 'LLM integration, Python automation, web scraping, data pipelines. Machines that work while you sleep.',
                    pips: 4,
                    icon: (
                      <svg className="skill-icon" aria-hidden="true" viewBox="0 0 36 36" fill="none">
                        <ellipse cx="18" cy="10" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M8 10 L8 18 Q8 22 18 22 Q28 22 28 18 L28 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M8 18 L8 26 Q8 30 18 30 Q28 30 28 26 L28 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    ),
                  },
                ].map((skill) => (
                  <div className="skill-item" key={skill.name}>
                    {skill.icon}
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
              {/* Featured */}
              <div className="project-card project-card-featured">
                <div className="project-card-image">
                  <div className="project-card-image-inner">
                    <span className="project-card-image-icon">SB</span>
                  </div>
                </div>
                <div className="project-card-body">
                  <p className="project-tag">Full-Stack — SaaS</p>
                  <h3 className="project-title">ShadowBoard</h3>
                  <p className="project-desc">A real-time project management SaaS built with Next.js, Supabase, and WebSockets. 10K+ active users, 99.9% uptime, deployed on AWS with zero-downtime CI/CD pipeline.</p>
                  <div className="project-footer">
                    <span className="project-year">2025</span>
                    <a className="project-link" href="#contact">View Project →</a>
                  </div>
                </div>
              </div>

              <div className="project-card">
                <div className="project-card-image">
                  <div className="project-card-image-inner">
                    <span className="project-card-image-icon">KU</span>
                  </div>
                </div>
                <div className="project-card-body">
                  <p className="project-tag">React — TypeScript</p>
                  <h3 className="project-title">KageUI</h3>
                  <p className="project-desc">Open-source component library with 40+ dark-themed UI components. 2.3K GitHub stars, full TypeScript support, Storybook docs.</p>
                  <div className="project-footer">
                    <span className="project-year">2025</span>
                    <a className="project-link" href="#contact">
                      View Intel
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 10,6" stroke="currentColor" strokeWidth="1.5" />
                        <polyline points="7,3 10,6 7,9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="project-card">
                <div className="project-card-image">
                  <div className="project-card-image-inner">
                    <span className="project-card-image-icon">NB</span>
                  </div>
                </div>
                <div className="project-card-body">
                  <p className="project-tag">Python — AI</p>
                  <h3 className="project-title">NinjaBot</h3>
                  <p className="project-desc">LLM-powered code review bot that integrates with GitHub PRs. Catches bugs, suggests refactors, enforces style guides. 94% accuracy on test suite.</p>
                  <div className="project-footer">
                    <span className="project-year">2024</span>
                    <a className="project-link" href="#contact">
                      View Intel
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 10,6" stroke="currentColor" strokeWidth="1.5" />
                        <polyline points="7,3 10,6 7,9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              <div className="project-card">
                <div className="project-card-image">
                  <div className="project-card-image-inner">
                    <span className="project-card-image-icon">SA</span>
                  </div>
                </div>
                <div className="project-card-body">
                  <p className="project-tag">Go — Microservices</p>
                  <h3 className="project-title">StealthAPI</h3>
                  <p className="project-desc">High-performance REST API gateway in Go handling 1M+ requests/day. Rate limiting, JWT auth, Redis caching, Kubernetes orchestration.</p>
                  <div className="project-footer">
                    <span className="project-year">2024</span>
                    <a className="project-link" href="#contact">
                      View Intel
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="2,6 10,6" stroke="currentColor" strokeWidth="1.5" />
                        <polyline points="7,3 10,6 7,9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY — no background image */}
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
                <p className="philosophy-body">Nine years of practice have produced one conclusion: every unnecessary element is a vulnerability. The strongest systems are not complex — they are ruthlessly refined.</p>
              </div>
              <div>
                <ul className="tenets-list">
                  {[
                    { num: 'I', title: 'Precision Over Volume', text: 'One deliberate action outperforms a hundred frantic ones. Quality of execution is the only measure that matters.' },
                    { num: 'II', title: 'Leave No Trace', text: 'Clean code. Clean contracts. Clean results. The footprint of a professional is the deliverable — nothing more.' },
                    { num: 'III', title: "The Client's Mission Is Sacred", text: 'Absolute discretion. Full commitment. Every engagement receives the same level of focus regardless of scale.' },
                    { num: 'IV', title: 'Adapt or Fail', text: 'No rigid methodology. No single tool. The situation defines the approach — not the other way around.' },
                  ].map((t) => (
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

        {/* TESTIMONIALS */}
        <section id="testimonials" aria-label="Client accounts">
          <div className="container">
            <p className="testimonials-eyebrow">Client Accounts</p>
            <h2 className="testimonials-heading">FIELD REPORTS</h2>
          </div>
          <div className="testimonials-track-wrap">
            <div className="testimonials-track" style={{ paddingInline: 'clamp(1rem, 5vw, 4rem)' }}>
              {[
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
                  quote: 'The OSINT pipeline has been running for 14 months without downtime. It processes threat data our analysts didn\'t know to ask for. Transformational work.',
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
              ].map((t) => (
                <div className="testimonial-card" key={t.name}>
                  <div className="testimonial-mark" aria-hidden="true">"</div>
                  <p className="testimonial-quote">{t.quote}</p>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                    <div className="testimonial-org">{t.org}</div>
                  </div>
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
                <p className="contact-intro">Engagements are accepted by referral or direct contact. All communications are encrypted and treated with full discretion. Response within 24 hours.</p>
                <div className="contact-channels">
                  <a className="contact-channel" href="mailto:shadow@kage.ops">
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <polyline points="2,5 10,11 18,5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                    <span className="contact-channel-label">Encrypted Mail</span>
                    <span className="contact-channel-detail">shadow@kage.ops</span>
                  </a>
                  <a className="contact-channel" href="#">
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M6 14 Q10 6 14 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="10" cy="8" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="contact-channel-label">Signal Protocol</span>
                    <span className="contact-channel-detail">By arrangement</span>
                  </a>
                  <a className="contact-channel" href="#">
                    <svg className="contact-channel-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="8" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <path d="M7 8 L7 5 Q7 2 10 2 Q13 2 13 5 L13 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="contact-channel-label">PGP Key</span>
                    <span className="contact-channel-detail">0xA4B7C9E1</span>
                  </a>
                </div>
              </div>
              <div className="contact-right-stack">
                <div className="contact-availability">
                  <div className="contact-avail-label">
                    <span className="contact-avail-dot" aria-hidden="true" />
                    Current Status
                  </div>
                  <div className="contact-avail-status">Taking Missions</div>
                  <p className="contact-avail-detail">Available for engagements beginning September 2026. Priority given to long-duration contracts requiring sustained operational focus.</p>
                </div>
                <div className="contact-terms">
                  <div className="contact-terms-title">Engagement Protocol</div>
                  <ul className="contact-terms-list">
                    <li>Initial briefing via encrypted channel only</li>
                    <li>NDA executed before scope discussion</li>
                    <li>50% retainer to activate engagement</li>
                    <li>All deliverables transferred at project close</li>
                    <li>No subcontracting — all work is direct</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER — dark background */}
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
                KAGE
              </a>
              <p className="footer-tagline">A shadow portfolio for disciplines that require precision, discretion, and a complete absence of wasted motion.</p>
            </div>
            <div>
              <p className="footer-col-heading">Navigate</p>
              <ul className="footer-nav-list">
                <li><a href="#skills">Disciplines</a></li>
                <li><a href="#projects">Missions</a></li>
                <li><a href="#philosophy">The Code</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="footer-col-heading">Protocol</p>
              <ul className="footer-nav-list">
                <li><a href="#contact">Open a Channel</a></li>
                <li><a href="#contact">Referral Process</a></li>
                <li><a href="#contact">PGP Key</a></li>
              </ul>
            </div>
          </div>
          <hr className="footer-divider" aria-hidden="true" />
          <div className="footer-bottom">
            <p className="footer-legal">© 2026 Kage. All operations classified.</p>
            <span className="footer-mark" aria-hidden="true">影</span>
          </div>
        </div>
      </footer>
    </>
  );
}
