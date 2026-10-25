import { useEffect, useRef } from 'react';
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer, type Texture } from 'three';
import portrait from '@assets/portraits/harsh-graphite-study.webp';

const vertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fragment = `
  uniform sampler2D uPortrait;
  uniform vec2 uSize;
  uniform vec2 uPointer;
  uniform vec2 uOrigin;
  uniform vec3 uTrail[4];
  uniform float uImageAspect;
  uniform float uEntry;
  uniform float uHover;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  vec2 imageUV(vec2 p,vec2 fit) { return p*fit+(1.0-fit)*.5; }
  const vec3 paper=vec3(.9301,.9131,.8714);
  // Composite the real transparent graphite drawing onto warm paper. One
  // texture lookup preserves its strokes and keeps the hover effect light.
  vec3 portraitAt(vec2 p,vec2 fit) {
    vec2 uv=imageUV(p,fit);
    if (uv.x<0.0 || uv.y<0.0 || uv.x>1.0 || uv.y>1.0) return paper;
    vec4 sampleColor=texture2D(uPortrait,uv);
    return mix(paper,sampleColor.rgb,sampleColor.a);
  }
  void main() {
    float aspect=uSize.x/uSize.y;
    vec2 metric=vec2(aspect,1.0);
    vec2 fit=aspect>uImageAspect ? vec2(aspect/uImageAspect,1.0) : vec2(1.0,uImageAspect/aspect);
    vec3 original=portraitAt(vUv,fit);
    // Square paper tesserae: graphite stays on the paper as each tile lifts.
    vec2 grid=uSize/26.0;
    vec2 cell=floor(vUv*grid);
    vec2 local=fract(vUv*grid)-.5;
    float seed=hash(cell);
    float radius=length((vUv-uPointer)*metric);
    float nearby=1.0-smoothstep(.025,.34,radius);
    float wake=0.0;
    for(int i=0;i<4;i++) {
      float distanceToTrail=length((vUv-uTrail[i].xy)*metric);
      wake=max(wake,(1.0-smoothstep(.02,.17,distanceToTrail))*uTrail[i].z);
    }
    float arrival=1.0-smoothstep(uEntry*.8-.10,uEntry*.8+.12,length((vUv-uOrigin)*metric)+seed*.05);
    float lift=uHover*arrival*clamp(.15+nearby*.85+wake*.24,0.0,1.0);
    float checker=mod(cell.x+cell.y,2.0);
    float angle=(seed-.5)*.45*lift;
    mat2 turn=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
    vec2 offset=vec2((seed-.5)*.16,(.12+seed*.16)*(checker*2.0-1.0))*lift;
    vec2 tile=turn*(local-offset);
    tile.x/=1.0-lift*(.10+.15*checker);
    tile.y/=1.0-lift*(.16-.06*checker);
    vec2 edge=abs(tile);
    float inside=1.0-smoothstep(.47-lift*.045,.495,max(edge.x,edge.y));
    vec3 drawing=portraitAt((cell+.5+tile)/grid,fit);
    float hatch=step(.84,fract((gl_FragCoord.x+gl_FragCoord.y)*.2));
    vec3 tilePaper=mix(paper, drawing,1.0-lift*.045);
    tilePaper-=vec3(.022)*lift*(.4+checker*.6);
    tilePaper-=vec3(.022)*hatch*lift;
    float shadow=(1.0-smoothstep(.46,.56,max(abs(local.x-offset.x),abs(local.y-offset.y))));
    vec3 gap=paper-vec3(.10)*shadow*lift;
    vec3 mosaic=mix(gap,tilePaper,inside);
    // The blank paper surrounding the portrait stays quiet.
    float ink=clamp(length(paper-original)*3.0,0.0,1.0);
    float tileInk=clamp(length(paper-portraitAt((cell+.5)/grid,fit))*4.0,0.0,1.0);
    vec3 color=mix(original,mosaic,lift*max(ink,tileInk));
    gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
    #include <colorspace_fragment>
  }

`;

/** Graphite paper tiles lift locally, then settle back into the original drawing. */
export default function HeroStage({ enabled = true, onReady }: { enabled?: boolean; onReady?: (ready: boolean) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    const hero = host?.closest<HTMLElement>('.hero');
    const study = host?.closest<HTMLElement>('.portrait-study');
    if (!host || !hero) return;
    onReady?.(false);
    host.style.removeProperty('opacity');
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); }
    catch { return; }
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0, 0);
    host.appendChild(renderer.domElement);
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 640px)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const scene = new Scene();
    const camera = new OrthographicCamera(-1,1,1,-1,.1,10);
    camera.position.z = 1;
    const geometry = new PlaneGeometry(2,2);
    const uniforms = {
      uPortrait: { value: null as Texture | null }, uSize: { value: new Vector2(1,1) },
      uPointer: { value: new Vector2(.67,.57) }, uOrigin: { value: new Vector2(.67,.57) },
      uTrail: { value: Array.from({ length: 4 }, () => new Vector3(.67,.57,0)) },
      uEntry: { value: 0 }, uImageAspect: { value: 1 },
      uHover: { value: 0 },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, depthTest: false, depthWrite: false });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
    let texture: Texture | undefined;
    let disposed = false, ready = false, visible = true, failed = false, publishedReady = false;
    let frame = 0, lastFrame = 0, entryAge = 0;
    const history: { x: number; y: number; time: number }[] = [];
    const target = new Vector2(.67,.57);
    let hover = 0;
    const moving = () => enabled && !preference.matches;
    const render = (now: number) => {
      frame = 0;
      if (disposed || failed || !ready || !visible || document.hidden) return;
      if (moving() && now-lastFrame < 32) { frame = requestAnimationFrame(render); return; }
      const dt = Math.min((now-lastFrame)/1000,.05);
      lastFrame = now;
      const reveal = hover || study?.dataset.portraitMode === 'tiles' ? 1 : 0;
      if (moving()) {
        entryAge = Math.min(entryAge+dt,3);
        uniforms.uEntry.value = entryAge;
        uniforms.uTrail.value.forEach((point,index) => {
          const sample = history[index];
          point.set(sample?.x ?? target.x,sample?.y ?? target.y,sample ? Math.max(0,1-(now-sample.time)/650) : 0);
        });
        uniforms.uPointer.value.lerp(target,1-Math.exp(-dt*10));
        uniforms.uHover.value += (reveal-uniforms.uHover.value)*(1-Math.exp(-dt*(reveal ? 7.5 : 5.5)));
      } else { uniforms.uHover.value = 0; }
      renderer.render(scene,camera);
      if (!publishedReady) { publishedReady = true; onReady?.(true); }
      hero.dataset.portraitReady = 'true';
      hero.dataset.portraitHover = String(uniforms.uHover.value > .1);
      if (moving() && (hover || study?.dataset.portraitMode === 'tiles' || uniforms.uHover.value > .001)) frame = requestAnimationFrame(render);
    };
    const schedule = () => { if (!frame && !disposed && !failed && ready && visible && !document.hidden) { lastFrame = performance.now(); frame = requestAnimationFrame(render); } };
    texture = new TextureLoader().load(portrait, loaded => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      uniforms.uPortrait.value = loaded;
      uniforms.uImageAspect.value = loaded.image.width / loaded.image.height;
      ready = true; schedule();
    },undefined,()=>{ failed = true; delete hero.dataset.portraitReady; });
    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setPixelRatio(small.matches ? 1 : Math.min(devicePixelRatio,1.5));
      renderer.setSize(host.clientWidth,host.clientHeight,false);
      uniforms.uSize.value.set(host.clientWidth,host.clientHeight);
      schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const sceneObserver = new MutationObserver(schedule);
    if (study) sceneObserver.observe(study, { attributes: true, attributeFilter: ['data-portrait-mode'] });
    const inView = new IntersectionObserver(entries=>{
      visible = entries[0].isIntersecting;
      if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    inView.observe(hero);
    const move = (event: PointerEvent) => {
      if (!moving() || !finePointer.matches || small.matches || event.pointerType !== 'mouse') return;
      const box = host.getBoundingClientRect();
      const over = event.target instanceof Element ? event.target : null;
      const onPortrait = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom && !over?.closest('.hero-text, a, button');
      const now = performance.now();
      if (onPortrait) {
        const x=(event.clientX-box.left)/box.width, y=1-(event.clientY-box.top)/box.height;
        if (!hover) {
          if (uniforms.uHover.value < .12) {
            entryAge = 0; uniforms.uOrigin.value.set(x,y); uniforms.uPointer.value.set(x,y);
          }
          history.length = 0;
        }
        const last=history[0];
        if (!last || now-last.time>75 || Math.hypot(x-last.x,y-last.y)>.025) {
          history.unshift({x,y,time:now}); history.length=Math.min(history.length,4);
        }
        target.set(x,y);
      }
      hover = onPortrait ? 1 : 0;
      schedule();
    };
    const leave = () => { hover = 0; schedule(); };
    const visibility = () => { if (document.hidden) { hover=0; cancelAnimationFrame(frame); frame=0; } else schedule(); };
    const motionChange = () => { leave(); schedule(); };
    const pointerChange = () => { if (!finePointer.matches || small.matches) leave(); };
    const lost = (event: Event) => { event.preventDefault(); failed=true; cancelAnimationFrame(frame); frame=0; delete hero.dataset.portraitReady; host.style.opacity='0'; onReady?.(false); };
    hero.addEventListener('pointermove',move,{ passive:true });
    hero.addEventListener('pointerleave',leave);
    document.addEventListener('visibilitychange',visibility);
    preference.addEventListener('change',motionChange);
    finePointer.addEventListener('change',pointerChange);
    small.addEventListener('change',pointerChange);
    renderer.domElement.addEventListener('webglcontextlost',lost);
    resize();
    return () => {
      disposed=true; cancelAnimationFrame(frame); observer.disconnect(); sceneObserver.disconnect(); inView.disconnect();
      hero.removeEventListener('pointermove',move); hero.removeEventListener('pointerleave',leave);
      document.removeEventListener('visibilitychange',visibility); preference.removeEventListener('change',motionChange);
      finePointer.removeEventListener('change',pointerChange); small.removeEventListener('change',pointerChange);
      renderer.domElement.removeEventListener('webglcontextlost',lost);
      texture?.dispose(); material.dispose(); geometry.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      delete hero.dataset.portraitReady; delete hero.dataset.portraitHover;
    };
  },[enabled,onReady]);
  return <div ref={hostRef} className="hero-atmosphere portrait-field" aria-hidden="true" />;
}
