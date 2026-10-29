import { useId, type CSSProperties } from 'react';

export function SketchProjectVisual({ kind }: { kind: 'ai' | 'data' | 'systems' | 'agent-safety' | 'vr' }) {
  const id = useId().replace(/:/g, '');
  return <svg className={`sketch-project sketch-project-${kind}`} viewBox="0 0 480 300" fill="none" aria-hidden="true">
    <defs>
      <pattern id={`hatch-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><path d="M0 0V6" stroke="currentColor" strokeWidth="0.7" opacity=".2" /></pattern>
      <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m1 1 7 4-7 4" stroke="currentColor" fill="none" /></marker>
    </defs>
    <g className="sketch-registration"><path d="M20 44V22H45M435 22H460V44M20 255V278H45M435 278H460V255" /><path d="M31 286H450" /><path d="M50 282v8m380-8v8" /></g>
    {kind === 'agent-safety' ? <>
      <path className="sketch-shadow" d="M42 72h128v142H42zM222 77l47 12 45-12v75l-46 43-46-43z" fill={`url(#hatch-${id})`} />
      <path className="sketch-outline" d="m35 63 132-2 1 143-133 2zM37 86h128" />
      <circle cx="47" cy="75" r="2" /><circle cx="57" cy="75" r="2" /><circle cx="67" cy="75" r="2" />
      <path d="M51 106h65m-65 12h93M51 135h94v20H51zM51 176h51" />
      <path d="M59 145h76" strokeWidth="7" opacity=".5" />
      <text className="sketch-label" x="43" y="225">REDACTED SCREEN</text>
      <path className="sketch-trace" pathLength="1" d="M170 132h39" markerEnd={`url(#arrow-${id})`} />
      <path className="sketch-outline" d="m218 69 50 13 49-13v84l-49 45-50-45z" />
      <path d="m230 86 38 10 37-10v61l-37 35-38-35z" opacity=".4" />
      <path className="sketch-trace" pathLength="1" d="m248 130 14 15 27-32" />
      <text x="232" y="225">ACTION GATE</text>
      <path className="sketch-trace" pathLength="1" d="M320 132h28" markerEnd={`url(#arrow-${id})`} />
      <path d="M357 91h78v90h-78zM368 108h48m-48 27h48m-48 27h48" />
      <circle cx="369" cy="108" r="3" /><circle cx="369" cy="135" r="3" /><circle cx="369" cy="162" r="3" />
      <text className="sketch-label" x="356" y="202">ALLOW / BLOCK</text>
      <text className="sketch-label" x="356" y="217">OWNER REVIEW</text>
      <path d="M267 202v42h128v-13" strokeDasharray="3 5" opacity=".5" />
      <text className="sketch-hand" x="224" y="43">a pause before action.</text>
      <text className="sketch-label" x="58" y="265">AEGISVM / COMPUTER-USE AGENTS</text>
    </> : kind === 'vr' ? <>
      <path className="sketch-shadow" d="m49 101 110-4 19 28-9 62-113 3-17-59zM281 66h145v154H281z" fill={`url(#hatch-${id})`} />
      <path className="sketch-outline" d="M48 103q57-17 115-4l18 30-10 53q-20 13-40 1l-17-16-18 18q-21 11-43-1l-14-52z" />
      <path d="M57 117q49-11 97-4l10 19-7 35q-16 7-29-6l-15-12-20 18q-13 8-27-1l-10-34zM49 105q-9-48 58-48 62 0 57 44M58 101q-1-32 48-32 45 0 48 29" />
      <circle cx="73" cy="135" r="3" /><circle cx="147" cy="133" r="3" />
      <text x="58" y="211">UNITY / OPENXR</text>
      <path className="sketch-trace" pathLength="1" d="M182 137c28-1 32-26 58-26" markerEnd={`url(#arrow-${id})`} />
      <path d="M267 211V75m0 136 146-10m-146 10 59-64" markerEnd={`url(#arrow-${id})`} />
      <path d="m281 196 116-8m-100-8 114-8m-99-7 109-7M293 204l48-57m-18 55 48-57m-18 54 46-56" opacity=".2" />
      <path className="sketch-trace" pathLength="1" d="M280 184c21 12 20-85 47-77s24 61 48 36 24-65 43-69" />
      <path d="M280 201c21 9 24-62 48-57s27 45 49 26 24-59 41-55" opacity=".35" />
      <text className="sketch-label" x="276" y="240">LIVE 3D GRAPHS</text>
      <path d="M54 243h117m-117 10h117" opacity=".35" /><circle cx="95" cy="243" r="4" /><circle cx="143" cy="253" r="4" />
      <text className="sketch-label" x="54" y="274">ADJUST / EXPLORE</text>
      <text className="sketch-hand" x="264" y="43">step inside the equation.</text>
    </> : kind === 'ai' ? <>
      <path className="sketch-shadow" d="M48 66h137v145H48z" fill={`url(#hatch-${id})`} />
      <path className="sketch-outline" d="m41 58 137-2 2 145-138 2zM43 82h133" />
      <circle cx="54" cy="70" r="2" /><circle cx="64" cy="70" r="2" /><circle cx="74" cy="70" r="2" />
      <path d="M59 104h79m-79 9h96M58 134h102v42H58z" />
      <text x="62" y="158">ASK A QUESTION</text><text className="sketch-label" x="49" y="227">01 / INTERFACE</text>
      <path className="sketch-trace" pathLength="1" d="M181 145c21-1 27-33 50-33" markerEnd={`url(#arrow-${id})`} />
      <path className="sketch-outline" d="m237 77 112 1-2 86-113-1z" /><path d="M245 86h94v68h-94z" opacity=".3" />
      <path d="m268 101 17 19-17 19m40-38-17 38" /><text x="242" y="184">LANGGRAPH</text>
      <path className="sketch-trace" pathLength="1" d="M350 119h45v62" markerEnd={`url(#arrow-${id})`} />
      <path d="M364 195c0-14 70-14 70 0m-70 0v43c0 14 70 14 70 0v-43m-70 0c0 14 70 14 70 0m-70 22c0 14 70 14 70 0" />
      <text x="369" y="270">RETRIEVAL</text><path className="sketch-trace sketch-trace-return" pathLength="1" d="M361 233c-67 42-137 28-202-22" markerEnd={`url(#arrow-${id})`} />
      <text className="sketch-hand" x="242" y="52">a little intelligence.</text>
    </> : kind === 'data' ? <>
      <path className="sketch-shadow" d="M85 52h173v207H85z" fill={`url(#hatch-${id})`} />
      <path d="m70 41 172 3-2 203-171-4zM85 32l173 4-1 202" /><path className="sketch-outline" d="M88 77h137m-137 11h110M89 119h82m-82 11h120M89 156h98m-98 11h74" />
      <text x="90" y="66">CREDENTIAL RECORD</text><path d="M89 198h57m-57 9h37" />
      <path className="sketch-trace" pathLength="1" d="m180 186 13 13 24-30" />
      <path className="sketch-trace" pathLength="1" d="M262 113c25 0 26 34 51 34" markerEnd={`url(#arrow-${id})`} />
      <path d="m329 94 64 9 16 64-46 48-47-48z" /><path className="sketch-outline" d="m337 105 49 7 13 52-36 38-36-38z" opacity=".5" />
      <rect x="346" y="146" width="34" height="29" rx="2" /><path d="M353 145v-9a10 10 0 0 1 20 0v9" /><circle cx="363" cy="158" r="2" /><path d="M363 160v6" />
      <text x="329" y="242">RBAC / MySQL</text><text className="sketch-hand" x="300" y="69">trust, by design.</text>
    </> : <>
      <path className="sketch-shadow" d="M100 66h273v174H100z" fill={`url(#hatch-${id})`} />
      {['UI / SWING', 'API', 'SERVICE', 'DAO / JDBC'].map((label, i) => <g className="sketch-layer" key={label} style={{ '--sketch-layer': i } as CSSProperties}>
        <path className="sketch-outline" d={`m${76 + i * 16} ${48 + i * 48} 260-2 2 35-261 2z`} />
        <text x={91 + i * 16} y={70 + i * 48}>0{i + 1}</text><text x={140 + i * 16} y={70 + i * 48}>{label}</text>
        <path d={`M${306 + i * 16} ${58 + i * 48}h17m-17 7h10`} />
      </g>)}
      <path className="sketch-trace" pathLength="1" d="M57 71v164h57" markerEnd={`url(#arrow-${id})`} /><text className="sketch-label" x="134" y="274">ONE RESPONSIBILITY PER LAYER</text>
      <text className="sketch-hand" x="265" y="29">less tangled. more useful.</text>
    </>}
  </svg>;
}

export function FocusDrawing({ index }: { index: number }) {
  const paths = [
    ['M16 18h86v57H16zM16 30h86M25 24h2m5 0h2m5 0h2', 'm41 42-10 10 10 10m34-20 10 10-10 10M63 39l-9 26', 'M39 85h45M61 75v10'],
    ['M17 47h23m22 0h25M51 18v18m0 23v20', 'm40 36 22 1-1 22-22-1zM9 39h16v16H9zM87 39h20v16H87zM43 10h16v15H43zM43 79h16v12H43z', 'm47 44 7 7m0-7-7 7'],
    ['M20 19h30v17H20zM76 19h23v17H76zM44 72h31v17H44z', 'M35 36v18h51V36M60 54v18', 'M28 26h13m42 0h9M51 80h16'],
    ['m24 77 50-56 12 11-50 56zM74 21l10-11 12 11-10 11M24 77l-5 17 17-6', 'm48 27-15-9-17 29 15 9m-2-28 8 5m-13 3 8 5m-14 3 8 5', 'M58 86h45m-45-6h33'],
  ];
  return <svg className="focus-drawing" viewBox="0 0 120 100" fill="none" aria-hidden="true">{paths[index % paths.length].map((d,i) => <path key={d} d={d} className={i === 1 ? 'sketch-trace' : undefined} pathLength="1" />)}</svg>;
}

export function ToolkitDrawing() {
  return <svg className="toolkit-drawing" viewBox="0 0 320 190" fill="none" aria-hidden="true">
    <path className="toolkit-shadow" d="m31 68 115-12 119 22-10 87-113-16-114 10z" />
    <path d="m28 55 118-10 117 21-9 85-110-18-118 11zM146 45l-2 88M36 62l102-9-2 72-102 10m120-82 100 19-7 70-95-15" />
    <path d="m62 79-12 13 12 10m46-28 11 10-12 15M91 72l-9 33M49 119l68-6m52-34 59 12m-58-2 40 8m-41 3 62 13m-63-4 39 8" />
    <path className="sketch-trace" pathLength="1" d="M55 151c49 17 135 31 206 17" />
    <path d="m240 38 12-23 14 7-12 23-31 61-16 13 1-21zM240 38l14 7M209 97l14 9m-14-5 2 13M252 15l4-7 14 7-4 7" />
    <path d="m282 72 18 4-18 77-18-4zM285 87l9 2m-12 11 7 2m-9 10 8 2m-12 11 7 2m-10 9 9 2" />
    <text x="30" y="29">from notes to working things.</text>
  </svg>;
}
