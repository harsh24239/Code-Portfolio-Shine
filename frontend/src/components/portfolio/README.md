# Simple animated portfolio

The original portrait, crimson palette, Fraunces / IBM Plex Mono fonts, profile copy, project descriptions, source links and section order remain intact.

The page contains the original hero, skills, projects, philosophy, background and contact sections. Search, the hero project index, side navigation, project filters, project-study dialogs, skill shortcut buttons, extra hero labels, email-copy control and giant footer signature have been removed. Projects are presented as a featured case-study lead followed by concise supporting cards, with each visual communicating the project's system shape before the description, technology stack, year and source link. The motion preference is a small control in the footer.

## Portrait to binary

`HeroStage` renders the original photograph using Three.js. Hovering the portrait starts an irregular binary wave at the entry point. Readable procedural 0/1 glyphs follow the photograph's tonal structure. The transformation is concentrated around the pointer so the rest of the portrait stays clear; a sparse foreground layer adds depth. Pointer velocity pushes the fragments and four trail samples fade over 450 ms to shape a short wake. Glyph changes are staggered across cells to avoid simultaneous flicker. Crimson and warm-white highlights move through the code, while some photographic detail preserves the face. The image reconstructs smoothly on leave.

A brief preview of the effect plays once per desktop tab session, after the heading entrance. Actual pointer interaction cancels it. It never loops and is skipped on small screens, coarse pointers, hidden/offscreen pages and reduced-motion settings. The WebGL enhancement is deferred until the native hero has painted and is not mounted on devices that cannot use the interaction. No generated model, extra image, font texture, account or API key is required.

Touch and reduced-motion visitors retain the photograph. The native JPG is the fallback for unavailable WebGL, failed texture loads or context loss. The GPU effect stops redrawing while idle, pauses offscreen and in hidden tabs, is capped at about 30 fps and disposes its resources, timers and listeners on unmount.

## Motion

`PortfolioMotion` coordinates restrained directional entrances, section handoff lines, a reading-progress rail, slight skill-card depth, magnetic controls and active navigation. The hero no longer pins while scrolling. The cursor is a small dot and ring without labels. GSAP handles quiet project entrances; Framer Motion is no longer imported by the page. The project list itself has no tilt or moving artwork. Native cursors return in form fields and when motion is disabled. The mobile navigation traps focus and supports Escape-to-close. The footer control and system preference disable movement throughout the page.

The portfolio and contact API endpoints are unchanged. Visual checks never send a contact message.

## Verification

Run `npm run typecheck`, `npm run build` and `git diff --check`. Browser QA checks binary hover/restoration, absence of removed controls, original content, source links, navigation, mobile widths and motion preferences.
