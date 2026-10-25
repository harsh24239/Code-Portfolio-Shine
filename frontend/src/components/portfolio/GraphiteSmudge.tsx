import { useId } from 'react';

/** A light finger-blended pencil mark that grounds an illustration on the paper. */
export default function GraphiteSmudge({ className = '' }: { className?: string }) {
  const id = `pencil-rub-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`graphite-smudge ${className}`} viewBox="0 0 480 200" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="-20%" y="-55%" width="140%" height="210%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".025 .12" numOctaves="3" seed="8" result="tooth" />
          <feDisplacementMap in="SourceGraphic" in2="tooth" scale="19" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} stroke="currentColor" strokeLinecap="round">
        <path d="M65 116c76-32 175-43 315-17" strokeWidth="41" opacity=".13" />
        <path d="M95 99c94-13 180-20 285-1" strokeWidth="23" opacity=".09" />
        <path d="M130 127c83-15 140-23 200-14" strokeWidth="15" opacity=".06" />
      </g>
    </svg>
  );
}
