# Clubhouse art integration

Load `hub/shared/clubhouse-art.js` as a classic script. It installs `window.UWClubhouseArt`; the current script URL is captured during execution, so loading from the café and from the hub resolves the same original local assets.

## API

- `await load()` returns `{cushions: boolean, unicorn: boolean}`. Call once at boot. The room, original art, and canonical characters are not changed. An unavailable optional sprite uses a procedural cushion or star puppet, not a replacement unicorn face. No automatic retries.
- `prop(ctx, kind, x, y, width, options = {})` draws a bottom-centred prop and returns true; unknown kinds/invalid geometry return false. Kinds: `art`, `fort`, `ball`, `puppets`, `frame`, `carry`, `paper`. Paper and carry are the same proudly carried drawing. `time` is seconds, `reduced` freezes animation, `selected` draws a quiet floor ring, and `picture` supplies the saved artwork.
- `drawPicture(ctx, picture, x, y, w, h)` draws cream paper using a top-left rectangle and the version-1 normalized operation contract. It does not mutate the supplied object. Unknown operations are ignored; colours accept three- or six-digit hexadecimal; geometry is bounded. No caller text enters SVG or HTML.
- `icon(kind)` returns a self-contained, fixed-vocabulary inline SVG string, with `aria-hidden` and no text. The caller must supply the button's accessible label. Kinds: `art`, `fort`, `ball`, `puppets`, `paper`, `brush`, `rainbow`, `heart`, `flower`, `carry`, `undo`, `save`, `frame`, `back`, `play`, `wave`, `dance`, `peek`, `cushion`. Aliases: `stamp-heart`, `stamp-flower`, `stamp-rainbow`, `finish`, `ramp`, `paint`. Unknown kinds fall back to paper.
- `cushion(ctx, 'pink'|'blue', x, y, width, rotation = 0)` is bottom-centred and reuses the original cushion atlas when loaded. Rotation is radians.
- `drawStamp(ctx, shape, color, x, y, size)` draws a heart, flower or rainbow centred on x/y; size is approximate full width.
- `drawBall(ctx, x, y, radius, color)` draws a softly shaded toy ball.
- `drawPuppet(ctx, 'unicorn'|'heart'|'star', x, y, height, {time,reduced})` uses a bottom anchor. The unicorn is the unmodified canonical source sprite mounted on a stick. The shape fallback is a star when the original sprite is not loaded.
- `ramp(ctx, x1, y1, x2, y2, depth = 13, color)` draws one bevelled pink/plum and gold rail between global endpoints. Vertical depth is measured in the current canvas coordinate system.
- `rampPoint(progress)` returns `{x,y}` for the centre of a ball following the three default rails, for progress 0..1. These are 320-unit prop-design coordinates. Convert with `worldX = anchorX + x * width / 320` and likewise for y.
- `palette` and `bounds` are frozen exports. Bounds are width-relative `[left,top,right,bottom]` around a prop's bottom-centre anchor, intended for placement, not collision.

Every drawing method balances canvas save/restore and leaves the caller's transform intact. The API does not run an animation loop, read profile data or attach input handlers.

## Activity close-ups

For a separately controlled rolling ball, use `prop(ctx, 'ball', ..., {ball:false})` and `drawBall` yourself. A spare blue ball remains next to the station. Alternatively supply `{progress: 0..1}` to position the pink ball precisely; this overrides its six-second time loop.

For a separately controlled puppet performance, use `{puppets:false}`. The theatre opening is a 320-unit design rectangle `x=-105, y=-179, width=210, height=112`. Scale it by prop width / 320 and clip any additional puppets to the stage opening so they do not overlap the sill. Drawing additional actors after the full theatre may cover curtains unless the caller clips to a narrower unobstructed stage region.

The fort is a blanket canopy with depth, original front cushions, pillow towers and a stitched mat. The art station is a low bevelled wooden table with perspective paper, stamp blocks, paint pots and brushes. The gallery frame is separate from the carried paper.

## Picture semantics

`{version:1, ops:[...]}` accepts:

- Stamp: `{tool:'stamp', shape:'heart'|'flower'|'rainbow', color:'#rrggbb', x:0..1, y:0..1, size:0.08..0.25}`.
- Brush: `{tool:'brush', color:'#rrggbb', width:0.005..0.06, points:[[x,y],...]}`.

Positions use the full paper width and height. Stamp size and brush width use the smaller paper dimension, so circles and brush tips stay circular on landscape paper. Marks are clipped at the paper edge. A one-point stroke is rendered as a dot. Blank/unsupported-version pictures stay blank rather than receiving invented sample art. The defensive limits are 800 operations and 1,600 points per stroke; the UI should keep saved pictures within these bounds.

## Visual checks still required

1. Check all four room stations at their integrated basement anchors at landscape phone and desktop sizes. Ensure the stairs, actor faces, window seat, and doorway remain clear.
2. Check art-table perspective, small-prop readability, and gold highlights against the original room lighting.
3. Confirm original cushion alpha edges and the canonical unicorn puppet load in the hub and café. Source images should remain unchanged.
4. Check picture marks, single-point strokes, undo, carried paper and gallery render exactly the same saved operations.
5. Check reduced motion, separately controlled ball/puppet views, clipping at the stage sill, and no duplicate moving ball.

This document records the implemented contract and suggested review, not a claim that browser or test-suite QA has passed.
