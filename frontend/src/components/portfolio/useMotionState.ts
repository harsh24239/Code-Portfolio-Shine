import { useEffect, useState } from 'react';

export default function useMotionState() {
  const [requested, setRequested] = useState(() => { try { return localStorage.getItem('portfolio-motion') !== 'off'; } catch { return true; } });
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const enabled = requested && !reduced;
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change',update);
    return () => query.removeEventListener('change',update);
  },[]);
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'on' : 'off';
    return () => { delete document.documentElement.dataset.motion; };
  },[enabled]);
  const toggle = () => setRequested(previous => {
    const next = !previous;
    try { localStorage.setItem('portfolio-motion',next?'on':'off'); } catch { /* Preference is still applied for this visit. */ }
    return next;
  });
  return { enabled, reduced, toggle };
}
