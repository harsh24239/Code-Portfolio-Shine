import { lazy, Suspense, useState } from 'react';
import portrait from '@assets/portraits/harsh-graphite-study.webp';

const HeroStage = lazy(() => import('./HeroStage'));

export default function PortraitStudy({ interactive, motionEnabled }: { interactive: boolean; motionEnabled: boolean }) {
  const [lifted, setLifted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  return (
    <figure className="portrait-study" data-portrait-mode={lifted ? 'tiles' : 'sketch'}>
      <div className="portrait-sheet">
        <svg className="portrait-guides" viewBox="0 0 500 580" fill="none" aria-hidden="true">
          <path d="M37 59V26H94M405 26H466V78M466 490V550H412M99 550H37V502" />
          <path className="portrait-construction" d="M57 263H464M265 42V533M76 70L442 526" />
          <path className="portrait-pencil-stroke" d="M389 94c33-3 48-14 53-34m-7 4 7-7 1 10M54 452c-10 16-16 35-12 53" />
        </svg>
        <img className="portrait-photo" src={portrait} alt="Graphite pencil portrait of Harsh Kumar, looking to the left" width="1254" height="1254" loading="eager" />
        <Suspense fallback={null}>{interactive && <HeroStage enabled={motionEnabled} onReady={setCanvasReady} />}</Suspense>
        <span className="portrait-margin-note" aria-hidden="true">a work in progress. always.</span>
      </div>
      <figcaption className="portrait-study-caption">
        <span>HARSH KUMAR <span className="portrait-caption-slash">/</span> GRAPHITE & PAPER</span>
        {interactive && canvasReady ? (
          <button type="button" className="portrait-toggle" aria-pressed={lifted} onClick={() => setLifted(!lifted)}>
            {lifted ? '← Settle the sketch' : 'Lift the paper tiles ↗'}
          </button>
        ) : <span className="portrait-caption-detail">Drawn in graphite. Built in code.</span>}
      </figcaption>
    </figure>
  );
}
