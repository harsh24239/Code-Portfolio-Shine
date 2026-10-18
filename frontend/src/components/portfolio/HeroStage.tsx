import { useEffect, useRef } from 'react';
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer, type Texture } from 'three';
import portrait from '@assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg';

const vertex = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fragment = `
  uniform sampler2D uPortrait;
  uniform vec2 uSize;
  uniform vec2 uPointer;
  uniform vec2 uOrigin;
  uniform vec2 uVelocity;
  uniform vec3 uTrail[4];
  uniform float uImageAspect;
  uniform float uTime;
  uniform float uEntry;
  uniform float uHover;
  uniform float uScroll;
  uniform float uMotion;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float binary(vec2 p,float bit) {
    if (p.x<0.0 || p.y<0.0 || p.x>=1.0 || p.y>=1.0) return 0.0;
    vec2 q=floor(p*vec2(5.0,7.0));
    float x=q.x,y=q.y;
    float zero=(y==0.0 || y==6.0) ? float(x>=1.0 && x<=3.0) : float(x==0.0 || x==4.0);
    float one=float(x==2.0 || (y==5.0 && x==1.0) || (y==0.0 && x>=1.0 && x<=3.0));
    return mix(zero,one,bit);
  }
  vec2 imageUV(vec2 p,vec2 cover) { return p*cover+(1.0-cover)*vec2(.65,.75); }
  vec3 portraitAt(vec2 p,vec2 cover) {
    return texture2D(uPortrait,imageUV((p-.5)/(1.035+uScroll*.035)+.5,cover)).rgb;
  }
  vec3 codeInk(vec3 source,float highlight) {
    float tone=dot(source,vec3(.2126,.7152,.0722));
    float structure=sqrt(smoothstep(.001,.24,tone));
    vec3 crimson=mix(vec3(.012,.0005,.0005),vec3(.92,.22,.19),structure);
    return mix(crimson,vec3(.95,.77,.71),highlight*structure);
  }
  void main() {
    float aspect=uSize.x/uSize.y;
    vec2 metric=vec2(aspect,1.0);
    vec2 cover=aspect>uImageAspect ? vec2(1.0,uImageAspect/aspect) : vec2(aspect/uImageAspect,1.0);
    vec3 photograph=portraitAt(vUv,cover);
    float radius=length((vUv-uPointer)*metric);
    float nearPointer=1.0-smoothstep(.07,.46,radius);
    float wake=0.0;
    for(int i=0;i<4;i++) {
      float distanceToTrail=length((vUv-uTrail[i].xy)*metric);
      wake=max(wake,(1.0-smoothstep(.02,.22,distanceToTrail))*uTrail[i].z);
    }
    float portraitMask=smoothstep(.34,.53,vUv.x);
    vec2 fineGrid=uSize/vec2(8.0,12.0);
    vec2 fineCell=floor(vUv*fineGrid);
    float seed=hash(fineCell);
    // An irregular front expands from the entry point, without drawing a visible ring.
    float originDistance=length((vUv-uOrigin)*metric);
    float arrival=1.0-smoothstep(uEntry*.95-.08,uEntry*.95+.16,originDistance+(seed-.5)*.06);
    float frontier=exp(-pow((originDistance-uEntry*.95)*13.0,2.0))*step(uEntry,1.6);
    float amount=uHover*portraitMask*arrival;
    float dissolve=smoothstep(seed*.67,seed*.67+.20,amount*(.52+.43*nearPointer+.14*wake));
    float energy=min(length(uVelocity)*.55,1.0);
    vec2 direction=normalize((vUv-uPointer)*metric+vec2(.0001))/metric;
    vec2 flow=direction*(nearPointer*.004+frontier*.009)*uHover;
    flow+=uVelocity*.008*wake*uHover;
    // Fine, stable glyphs retain the portrait's tonal structure.
    vec2 fineUV=vUv-flow*.45;
    fineCell=floor(fineUV*fineGrid);
    vec2 local=fract(fineUV*fineGrid);
    float fineSeed=hash(fineCell);
    float bit=step(.5,hash(fineCell+floor(uTime*1.15)*.13));
    float glyph=binary((local-vec2(.17,.12))/vec2(.66,.76),bit);
    vec3 source=portraitAt((fineCell+.5)/fineGrid,cover);
    float signal=pow(.5+.5*sin(uTime*1.8-fineCell.y*.13+fineSeed*4.0),10.0);
    float highlight=clamp(frontier*.55+signal*.20+nearPointer*energy*.2,0.0,.75);
    vec3 data=vec3(.005,0.0,0.0)+codeInk(source,highlight)*glyph;
    // Keep a little photographic detail between the characters so the face still reads.
    data+=source*.10*(1.0-glyph);
    vec3 color=mix(photograph,data,dissolve*.86);

    // A sparse foreground layer separates into larger, brighter fragments near the wave.
    vec2 coarseGrid=uSize/vec2(19.0,28.0);
    vec2 coarseUV=vUv-flow*2.6-vec2(0.0,sin(uTime*.7)*.004*uHover);
    vec2 coarseCell=floor(coarseUV*coarseGrid);
    vec2 coarseLocal=fract(coarseUV*coarseGrid);
    float coarseSeed=hash(coarseCell+vec2(19.0,31.0));
    float coarseBit=step(.5,hash(coarseCell+floor(uTime*.75)));
    float coarseGlyph=binary((coarseLocal-vec2(.17,.12))/vec2(.66,.76),coarseBit);
    float sparse=step(.91,coarseSeed);
    float lift=clamp(frontier*.8+nearPointer*.38+wake*energy*.55,0.0,1.0);
    vec3 coarseSource=portraitAt((coarseCell+.5)/coarseGrid,cover);
    color+=codeInk(coarseSource,.65)*coarseGlyph*sparse*lift*amount*.75;
    // A few larger fragments drift out of alignment before snapping back into the portrait.
    float fracture=clamp((frontier*1.4+nearPointer*.7+wake*.35)*amount,0.0,1.0);
    vec2 shardOffset=(vec2(hash(coarseCell+vec2(41.0,17.0)),hash(coarseCell+vec2(73.0,29.0)))-.5)*.05*fracture;
    vec3 shardSource=portraitAt((coarseCell+.5)/coarseGrid+shardOffset,cover);
    color+=(codeInk(shardSource,.9)-codeInk(coarseSource,.2))*coarseGlyph*sparse*fracture*.7;
    // A fine red edge light accompanies the transformation, using the original palette.
    color+=vec3(.024,.001,.001)*frontier*amount*(1.0-glyph);
    gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
    #include <colorspace_fragment>
  }
`;

/** A portrait-aware binary wave, with pointer inertia and a short reconstruction trail. */
export default function HeroStage({ enabled = true }: { enabled?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    const hero = host?.closest<HTMLElement>('.hero');
    if (!host || !hero) return;
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
      uVelocity: { value: new Vector2() }, uTrail: { value: Array.from({ length: 4 }, () => new Vector3(.67,.57,0)) },
      uEntry: { value: 0 }, uImageAspect: { value: 1 },
      uTime: { value: 0 }, uHover: { value: 0 }, uScroll: { value: 0 }, uMotion: { value: enabled && !preference.matches ? 1 : 0 },
    };
    const material = new ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, depthTest: false, depthWrite: false });
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);
    let texture: Texture | undefined;
    let disposed = false, ready = false, visible = true, failed = false;
    let frame = 0, lastFrame = 0, elapsed = 0, entryAge = 0;
    let previewTimer = 0, previewUntil = 0, interacted = false, pointerTime = 0;
    const velocity = new Vector2();
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
      const preview = now < previewUntil;
      const reveal = hover || preview ? 1 : 0;
      if (moving()) {
        elapsed += dt;
        entryAge = Math.min(entryAge+dt,3);
        uniforms.uEntry.value = entryAge;
        uniforms.uVelocity.value.lerp(velocity,1-Math.exp(-dt*10));
        velocity.multiplyScalar(Math.exp(-dt*7));
        uniforms.uTrail.value.forEach((point,index) => {
          const sample = history[index];
          point.set(sample?.x ?? target.x,sample?.y ?? target.y,sample ? Math.max(0,1-(now-sample.time)/650) : 0);
        });
        uniforms.uPointer.value.lerp(target,1-Math.exp(-dt*4));
        uniforms.uHover.value += (reveal-uniforms.uHover.value)*(1-Math.exp(-dt*(reveal ? 5.5 : 4.2)));
      } else { uniforms.uHover.value = 0; uniforms.uVelocity.value.set(0,0); }
      uniforms.uTime.value = moving() ? elapsed : 0;
      uniforms.uMotion.value = moving() ? 1 : 0;
      uniforms.uScroll.value = Number(hero.style.getPropertyValue('--scene-scroll')) || 0;
      renderer.render(scene,camera);
      hero.dataset.portraitReady = 'true';
      hero.dataset.portraitHover = String(uniforms.uHover.value > .1);
      if (moving() && (hover || preview || uniforms.uHover.value > .001)) frame = requestAnimationFrame(render);
    };
    const schedule = () => { if (!frame && !disposed && !failed && ready && visible && !document.hidden) { lastFrame = performance.now(); frame = requestAnimationFrame(render); } };
    texture = new TextureLoader().load(portrait, loaded => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      uniforms.uPortrait.value = loaded;
      uniforms.uImageAspect.value = loaded.image.width / loaded.image.height;
      ready = true; schedule();
      let seen = false;
      try { seen = sessionStorage.getItem('portfolio-binary-preview') === 'seen'; } catch { /* Optional first-visit cue. */ }
      if (!seen && moving() && finePointer.matches && !small.matches) {
        previewTimer = window.setTimeout(() => {
          if (disposed || interacted || !moving() || !finePointer.matches || small.matches || !visible || document.hidden) return;
          uniforms.uOrigin.value.set(.68,.60); target.set(.68,.60); entryAge = 0;
          previewUntil = performance.now()+950;
          hero.dataset.portraitPreview = 'played';
          try { sessionStorage.setItem('portfolio-binary-preview','seen'); } catch { /* The cue is still one-shot for this mount. */ }
          schedule();
        },1200);
      }
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
    sceneObserver.observe(hero, { attributes: true, attributeFilter: ['style'] });
    const inView = new IntersectionObserver(entries=>{
      visible = entries[0].isIntersecting;
      if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    inView.observe(hero);
    const move = (event: PointerEvent) => {
      if (!moving() || !finePointer.matches || small.matches || event.pointerType !== 'mouse') return;
      interacted = true; clearTimeout(previewTimer); previewUntil = 0;
      const box = hero.getBoundingClientRect();
      const over = event.target instanceof Element ? event.target : null;
       const onPortrait = event.clientX > box.left + box.width * .42 && !over?.closest('.hero-text, a, button');
      const now = performance.now();
      if (onPortrait) {
        const x=(event.clientX-box.left)/box.width, y=1-(event.clientY-box.top)/box.height;
        if (!hover) {
          if (uniforms.uHover.value < .12) {
            entryAge = 0; uniforms.uOrigin.value.set(x,y); uniforms.uPointer.value.set(x,y);
          }
          velocity.set(0,0); history.length = 0;
        } else if (pointerTime) {
          const dt=Math.max((now-pointerTime)/1000,.016);
          velocity.set((x-target.x)/dt,(y-target.y)/dt).clampLength(0,2);
        }
        const last=history[0];
        if (!last || now-last.time>75 || Math.hypot(x-last.x,y-last.y)>.025) {
          history.unshift({x,y,time:now}); history.length=Math.min(history.length,4);
        }
        target.set(x,y); pointerTime=now;
      }
      hover = onPortrait ? 1 : 0;
      schedule();
    };
    const leave = () => { hover = 0; previewUntil = 0; clearTimeout(previewTimer); pointerTime = 0; schedule(); };
    const visibility = () => { if (document.hidden) { hover=0; previewUntil=0; cancelAnimationFrame(frame); frame=0; } else schedule(); };
    const motionChange = () => { leave(); schedule(); };
    const pointerChange = () => { if (!finePointer.matches || small.matches) leave(); };
    const lost = (event: Event) => { event.preventDefault(); failed=true; cancelAnimationFrame(frame); frame=0; delete hero.dataset.portraitReady; host.style.opacity='0'; };
    hero.addEventListener('pointermove',move,{ passive:true });
    hero.addEventListener('pointerleave',leave);
    document.addEventListener('visibilitychange',visibility);
    preference.addEventListener('change',motionChange);
    finePointer.addEventListener('change',pointerChange);
    small.addEventListener('change',pointerChange);
    renderer.domElement.addEventListener('webglcontextlost',lost);
    resize();
    return () => {
      disposed=true; clearTimeout(previewTimer); cancelAnimationFrame(frame); observer.disconnect(); sceneObserver.disconnect(); inView.disconnect();
      hero.removeEventListener('pointermove',move); hero.removeEventListener('pointerleave',leave);
      document.removeEventListener('visibilitychange',visibility); preference.removeEventListener('change',motionChange);
      finePointer.removeEventListener('change',pointerChange); small.removeEventListener('change',pointerChange);
      renderer.domElement.removeEventListener('webglcontextlost',lost);
      texture?.dispose(); material.dispose(); geometry.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      delete hero.dataset.portraitReady; delete hero.dataset.portraitHover; delete hero.dataset.portraitPreview;
    };
  },[enabled]);
  return <div ref={hostRef} className="hero-atmosphere portrait-field" aria-hidden="true" />;
}
