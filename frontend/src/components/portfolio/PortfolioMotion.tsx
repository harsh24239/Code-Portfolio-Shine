import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './portfolio-motion.css';

gsap.registerPlugin(ScrollTrigger);

/** One motion system for entrances, scroll choreography, navigation and pointer depth. */
export default function PortfolioMotion({ enabled = true }: { enabled?: boolean }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<SVGSVGElement>(null);
  const strokeRef = useRef<SVGPathElement>(null);
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('.hero');
    if (!hero) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const mm = gsap.matchMedia();
    const disposers: (() => void)[] = [];
    const cards = new Map<HTMLElement, () => void>();
    const buttons = new Set<HTMLElement>();
    const bindPointer = () => {
      cards.forEach((dispose, card) => { if (!card.isConnected) { dispose(); cards.delete(card); } });
      document.querySelectorAll<HTMLElement>('.skill-item').forEach(card => {
        if (cards.has(card)) return;
        card.classList.add('depth-card');
        const move = (event: PointerEvent) => {
          if (!enabled || preference.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
          const box = card.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
          const y = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
          card.style.setProperty('--tilt-x', `${(0.5 - y) * 1.5}deg`);
          card.style.setProperty('--tilt-y', `${(x - 0.5) * 1.5}deg`);
          card.style.setProperty('--shine-x', `${x * 100}%`);
          card.style.setProperty('--shine-y', `${y * 100}%`);
          card.dataset.depthActive = 'true';
        };
        const reset = () => {
          ['--tilt-x','--tilt-y','--shine-x','--shine-y'].forEach(key => card.style.removeProperty(key));
          delete card.dataset.depthActive;
        };
        card.addEventListener('pointermove', move, { passive: true });
        card.addEventListener('pointerleave', reset);
        card.addEventListener('pointercancel', reset);
        cards.set(card, () => {
          card.removeEventListener('pointermove', move);
          card.removeEventListener('pointerleave', reset);
          card.removeEventListener('pointercancel', reset);
          card.classList.remove('depth-card');
          reset();
        });
      });
      document.querySelectorAll<HTMLElement>('.hero-actions a, .nav-cta, .contact-channel').forEach(button => {
        if (buttons.has(button)) return;
        buttons.add(button);
        const move = (event: PointerEvent) => {
          if (!enabled || preference.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
          const box = button.getBoundingClientRect();
          button.style.setProperty('--magnet-x', `${((event.clientX - box.left) / box.width - .5) * 7}px`);
          button.style.setProperty('--magnet-y', `${((event.clientY - box.top) / box.height - .5) * 7}px`);
        };
        const reset = () => { button.style.removeProperty('--magnet-x'); button.style.removeProperty('--magnet-y'); };
        button.addEventListener('pointermove', move, { passive: true });
        button.addEventListener('pointerleave', reset);
        disposers.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', reset); reset(); });
      });
    };
    bindPointer();
    const pointerObserver = new MutationObserver(bindPointer);
    pointerObserver.observe(document.querySelector('main')!, { childList: true, subtree: true });

    mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, context => {
      if (!enabled || !context.conditions?.motion) return;
      if (scrollY < hero.offsetHeight * .4) {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
        intro.from('.hero-eyebrow', { autoAlpha: 0, y: 12, duration: .7 }, 0)
          .from('.hero-title-main > span', { autoAlpha: 0, y: 46, rotateX: -12, clipPath: 'inset(0 0 100% 0)', duration: 1.05, stagger: .11 }, .08)
          .from('.hero-sub', { autoAlpha: 0, y: 20, duration: .8 }, .5)
          .from('.hero-actions', { autoAlpha: 0, y: 16, duration: .75 }, .68)
          .from('.hero-stats > div', { autoAlpha: 0, y: 14, duration: .7, stagger: .07 }, .8);
      }
      gsap.to(hero, { '--scene-scroll': 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8, invalidateOnRefresh: true } });
      document.querySelectorAll<HTMLElement>('main > section[id]').forEach(section => {
        gsap.fromTo(section, { '--section-glow': 0 }, {
          '--section-glow': 1,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top 86%', end: 'top 32%', scrub: true, invalidateOnRefresh: true },
        });
      });
      const prepared = new Set<Element>();
      const prepare = () => {
        let changed = false;
        document.querySelectorAll<HTMLElement>('.skills-heading-col, .skill-item, .projects-header, .project-card, .philosophy-text-col, .tenet-item, #about h2, .contact-layout > div, .footer-inner > div').forEach(element => {
          if (prepared.has(element)) return;
          prepared.add(element);
          changed = true;
          const depth = element.matches('.skill-item');
          const project = element.matches('.project-card');
          const fromLeft = element.matches('.skills-heading-col, .projects-header, .philosophy-text-col, #about h2') || element.matches('.skill-item:nth-child(odd), .contact-layout > div:first-child');
          const reveal = depth
            ? { '--reveal-y': '26px', '--reveal-x': fromLeft ? '-24px' : '24px' }
            : project
              ? { '--project-lift': '30px', '--project-tilt': '4deg' }
              : { x: fromLeft ? -32 : 32, y: 16 };
          gsap.from(element, { ...reveal, opacity: 0, duration: project ? .82 : 1, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } });
          if (element.matches('.skill-item')) {
            const pips = element.querySelectorAll('.skill-rank-pip');
            if (pips.length) gsap.from(pips, { scaleX: 0, transformOrigin: 'left', stagger: .06, duration: .55, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 87%', once: true } });
          }
        });
        if (changed) ScrollTrigger.refresh();
      };
      prepare();
      const observer = new MutationObserver(() => context.add(prepare));
      observer.observe(document.querySelector('main')!, { childList: true, subtree: true });
      return () => observer.disconnect();
    });

    const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.nav-links a')];
    const sections = navLinks.map(link => document.querySelector<HTMLElement>(link.hash)).filter((section): section is HTMLElement => !!section);
    let cursorFrame = 0;
    let progressFrame = 0;
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    const stroke = strokeRef.current;
    let marks: { x: number; y: number; time: number }[] = [];
    const follow = () => {
      const now = performance.now();
      marks = marks.filter(point => now - point.time < 340);
      if (stroke && trail) {
        const path = marks.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
        stroke.setAttribute('d', path);
        trail.style.opacity = marks.length > 1 ? String(.28 * Math.max(0, 1 - (now - marks[marks.length - 1].time) / 340)) : '0';
      }
      cursorFrame = marks.length ? requestAnimationFrame(follow) : 0;
    };
    const hideCursor = () => {
      if (cursor) { delete cursor.dataset.visible; delete cursor.dataset.down; }
      if (trail) trail.style.opacity = '0';
      if (stroke) stroke.setAttribute('d', '');
      marks = [];
      delete document.documentElement.dataset.cursor;
      cancelAnimationFrame(cursorFrame); cursorFrame = 0;
    };
    const moveCursor = (event: PointerEvent) => {
      if (!enabled || !cursor || preference.matches || !finePointer.matches || event.pointerType !== 'mouse' || document.querySelector('dialog[open]')) { hideCursor(); return; }
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) { hideCursor(); return; }
      // The pencil tip tracks the real pointer exactly; only its short graphite trail lingers.
      cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      document.documentElement.dataset.cursor = 'on';
      cursor.dataset.visible = 'true';
      cursor.dataset.mode = target?.closest('a, button') ? 'action' : 'default';
      const surface = target?.closest('#philosophy, footer, .project-card-image') ? 'dark' : 'paper';
      cursor.dataset.surface = surface;
      if (trail) trail.dataset.surface = surface;
      const last = marks[marks.length - 1];
      if (!last || Math.hypot(event.clientX-last.x,event.clientY-last.y)>3) {
        marks.push({ x: event.clientX, y: event.clientY, time: performance.now() });
        if (marks.length > 24) marks.shift();
      }
      if (!cursorFrame) cursorFrame = requestAnimationFrame(follow);
    };
    const pressCursor = () => { if (cursor?.dataset.visible) cursor.dataset.down = 'true'; };
    const releaseCursor = () => { if (cursor) delete cursor.dataset.down; };
    const keyboardCursor = (event: KeyboardEvent) => { if (event.key === 'Tab' || event.key === 'Escape') hideCursor(); };
    const modalObserver = new MutationObserver(() => { if (document.querySelector('dialog[open]')) hideCursor(); });
    modalObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    const progress = () => {
      progressFrame = 0;
      const range = document.documentElement.scrollHeight - innerHeight;
      document.documentElement.style.setProperty('--reading-progress', String(range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0));
      const current = [...sections].reverse().find(section => section.getBoundingClientRect().top <= innerHeight * .45);
      navLinks.forEach(link => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    };
    const update = () => { if (!progressFrame) progressFrame = requestAnimationFrame(progress); };
    let layoutTimer = 0;
    let layoutHeight = 0;
    const main = document.querySelector('main')!;
    const layoutObserver = new ResizeObserver(() => {
      const nextHeight = Math.round(main.getBoundingClientRect().height);
      if (nextHeight === layoutHeight) return;
      layoutHeight = nextHeight;
      clearTimeout(layoutTimer);
      layoutTimer = window.setTimeout(() => { ScrollTrigger.refresh(); update(); }, 160);
    });
    layoutObserver.observe(main);
    const change = () => {
      hideCursor();
      cards.forEach((_, card) => {
        delete card.dataset.depthActive;
        ['--tilt-x','--tilt-y','--shine-x','--shine-y'].forEach(key => card.style.removeProperty(key));
      });
    };
    document.addEventListener('pointermove', moveCursor, { passive: true });
    document.addEventListener('pointerleave', hideCursor);
    document.addEventListener('pointerdown', pressCursor, { passive: true });
    document.addEventListener('pointerup', releaseCursor, { passive: true });
    document.addEventListener('pointercancel', hideCursor);
    document.addEventListener('keydown', keyboardCursor);
    window.addEventListener('blur', hideCursor);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('resize', hideCursor);
    preference.addEventListener('change', change);
    finePointer.addEventListener('change', hideCursor);
    update();
    document.fonts.ready.then(() => { if (document.contains(hero)) ScrollTrigger.refresh(); });
    return () => {
      mm.revert();
      pointerObserver.disconnect();
      modalObserver.disconnect();
      hideCursor();
      layoutObserver.disconnect();
      clearTimeout(layoutTimer);
      cards.forEach(dispose => dispose());
      disposers.forEach(dispose => dispose());
      document.removeEventListener('pointermove', moveCursor);
      document.removeEventListener('pointerleave', hideCursor);
      document.removeEventListener('pointerdown', pressCursor);
      document.removeEventListener('pointerup', releaseCursor);
      document.removeEventListener('pointercancel', hideCursor);
      document.removeEventListener('keydown', keyboardCursor);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('resize', hideCursor);
      preference.removeEventListener('change', change);
      finePointer.removeEventListener('change', hideCursor);
      cancelAnimationFrame(cursorFrame); cancelAnimationFrame(progressFrame);
      document.documentElement.style.removeProperty('--reading-progress');
      navLinks.forEach(link=>link.removeAttribute('aria-current'));
    };
  }, [enabled]);
  return <>
    <div className="reading-progress" aria-hidden="true" />
    <svg className="pencil-trail" ref={trailRef} aria-hidden="true"><path ref={strokeRef} fill="none" /></svg>
    <div className="pointer-aura pencil-cursor" ref={cursorRef} aria-hidden="true">
      <svg className="pencil-body" viewBox="0 0 36 48" fill="none">
        <path className="pencil-wood" d="m4 44 3-15L25 4l8 6-18 25z" />
        <path className="pencil-barrel" d="M7 29 25 4l8 6-18 25z" />
        <path d="m7 29 8 6M10 30 28 6M4 44l5-3-4-3zM25 4l2-3 8 6-2 3" />
        <path className="pencil-glint" d="m13 27 14-19" />
      </svg>
      <svg className="pencil-action-mark" viewBox="0 0 48 18" fill="none"><path d="M4 12c11-6 24-7 39-5M8 16l29-4" /></svg>
    </div>
  </>;
}
