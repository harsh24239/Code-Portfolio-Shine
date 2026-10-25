# Portfolio sketchbook direction

Warm paper, graphite, restrained slate and sage. The portrait is an actual graphite illustration rather than a CSS edge filter. Technical project studies, chapter labels, margin notes, pencil rules, illustrated focus areas and a correspondence sheet carry the same visual language through the page. Existing portfolio content and backend integration are retained.

## Composition refinements

The portrait occupies the original hero's large right-hand background position, with the heading and introduction layered on the left. Paper fades keep the copy readable and blend the transparent drawing into the page. The phone layout keeps a quieter version of the portrait behind the content. The toolkit has a bespoke open-notebook drawing, and the focus section uses larger illustrated two-column plates that stack on phones. A charcoal footer closes the page with warm white lettering, a large editorial invitation and a lightly doubled pencil arrow.

## Portrait asset

- Final asset: `frontend/src/assets/portraits/harsh-graphite-study.webp`
- Created with the built-in image-generation tool, then encoded as WebP with alpha preserved for delivery (no further art edits).
- Source reference: the existing red side-profile illustration in `frontend/src/assets/43aacf07-6d68-4564-9e49-16083d623024_1785459834010.jpg`.
- The original source portrait remains unchanged. The generated portrait is illustrative artwork, not a photograph.

## Generation prompt

Use case: identity-preserve / graphite style transfer. Edit target: the supplied red portrait. Create a polished hand-drawn graphite pencil portrait of EXACTLY the same young man, same left-facing profile, facial proportions, swept-back hairstyle, visible ear, slight beard and dark crewneck. Preserve his identity and pose. Replace the entire red/neon digital rendering with authentic graphite drawing: fine confident contour lines, expressive pencil hair strokes, carefully modeled face, crosshatched shadows, some loose construction lines at shoulder edges. Strong enough dark graphite contrast to read crisply as the principal artwork of a professional software engineer portfolio, restrained and artistic, not a pale embossed edge filter. Composition: complete head with breathing room above the hair, neck and upper shoulders in a vertical portrait composition, no cut-off hair, no extra people, no hands. Transparent background, actual alpha, graphite strokes only; allow paper to show through. Remove ALL binary digits, red colors, background scenery and effects. No labels, no text, no signature, no frame, no watermark. Editorial pencil study on transparent background, high quality nuanced drawing rather than a photographic grayscale conversion. Keep the face and pose from the reference.

## Interaction and access

A local paper-tile reconstruction replaces the earlier binary glyphs. Alternating square fragments lift, turn slightly and reveal pencil hatching around the pointer, then settle back into the portrait. The effect does not activate over the hero text or links. Its explicit toggle supports keyboard use as well as pointer hover. The static sketch is the fallback on smaller screens, when motion is off, or when WebGL is unavailable. Diagram tracing is decorative and respects reduced-motion preferences. Project illustrations are conceptual diagrams of the stacks described in the existing projects, not product screenshots.

## Stability and chapter materials

The portrait plane has a stable height at each breakpoint, independent of font loading and hero copy. Both native image and WebGL canvas use the same contain fit and bounds. The native image stays visible at rest; the canvas fades in only during interaction. The old automatic first-visit animation is removed, and the portrait asset is preloaded. The figure is moved farther right to clear the end of SHADOWS, including tablet sizes.

The cursor is a code-native pencil with its tip fixed to the actual pointer position. A short graphite trail fades out in 340ms; links reveal a small pencil underline. It switches to light marks on dark panels, restores the standard cursor in form fields and menus, and is disabled for touch and reduced motion.

The toolkit uses sage drawing paper and layered index cards. Project drawings sit on dark graphite drafting boards beside warm paper descriptions. The principles chapter uses a charcoal surface with ivory type. Focus plates sit on dotted stock, and the correspondence form uses a lightly ruled sheet over a sage writing desk. The dark footer remains the closing anchor.

## Corner graphite finishing

Feathered pencil shading frames all four corners of the hero, with a stronger upper-left wash and lighter balancing marks on the other edges. Fine curved hatch marks and procedural paper grain give the edges a drawn quality, with a gradual fade into the untouched centre. This is static decoration, clipped to the hero and lighter on phones. The portrait stays free of floating clouds. Narrow finger-blended pencil strokes return beneath the notebook, project diagrams and focus illustrations at substantially lower opacity; they ground the drawings without surrounding them in grey blobs.

A further 5.5% portrait zoom on desktop (3.5% on phones) gives the drawing more presence. Its origin preserves the right-hand composition and the space before the headline. The native image and interactive tiles share the same scale and origin, while the drawing sheet clips overflow to retain a clean feathered lower edge.
