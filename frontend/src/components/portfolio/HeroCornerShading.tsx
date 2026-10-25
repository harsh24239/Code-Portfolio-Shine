import { useId } from 'react';

/** Feathered graphite on opposite paper edges; the centre stays unmarked. */
export default function HeroCornerShading() {
  const id = `corner-graphite-${useId().replace(/:/g, '')}`;
  return (
    <div className="hero-corner-shading" aria-hidden="true">
      {['top', 'right', 'left', 'bottom'].map((corner, index) => (
        <svg key={corner} className={`hero-corner hero-corner-${corner}`} viewBox="0 0 600 600" fill="none" focusable="false">
          <defs>
            <radialGradient id={`${id}-${corner}-tone`} cx="0" cy="0" r="1" gradientTransform="translate(65 50) rotate(38) scale(510 435)" gradientUnits="userSpaceOnUse">
              <stop stopColor="currentColor" stopOpacity=".48" />
              <stop offset=".3" stopColor="currentColor" stopOpacity=".28" />
              <stop offset=".7" stopColor="currentColor" stopOpacity=".09" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-${corner}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed={index + 4} result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .26 .26 .26 0 .16" result="tooth" />
              <feComposite in="SourceGraphic" in2="tooth" operator="in" />
            </filter>
            <mask id={`${id}-${corner}-fade`} style={{ maskType: 'alpha' }}>
              <rect width="600" height="600" fill={`url(#${id}-${corner}-tone)`} />
            </mask>
          </defs>
          <rect width="600" height="600" fill={`url(#${id}-${corner}-tone)`} opacity=".65" />
          <rect width="600" height="600" fill={`url(#${id}-${corner}-tone)`} filter={`url(#${id}-${corner}-grain)`} />
          <g mask={`url(#${id}-${corner}-fade)`} stroke="currentColor" strokeWidth=".65" opacity=".33">
            {Array.from({ length: 32 }, (_, line) => (
              <path key={line} d={`M${-150 + line * 16} -30 Q${40 + line * 13} 140 ${-40 + line * 15} 420`} />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}
