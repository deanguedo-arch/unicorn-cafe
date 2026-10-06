# Full fitted wardrobe integration — 2026-10-06

The supplied `UnicornWorld_Full_Wardrobe_Production.zip` replaces generic garment placement with 23 wearables registered across 19 canonical poses. The existing catalogue, prices, ownership, outfit fields, native saves, movement and collision rules are unchanged.

Source assets and metadata are retained without modification in `assets/wardrobe/production/`. `IMPORT-RECORD.json` records the archive fingerprint, pinned source commit and import checks. `runtime.js` is generated from the two imported manifests; it contains data only and loads as a classic script so legacy café/adventure origins work without adding CORS requirements.

`shared/art.js` uses the recorded atlas content rectangles, trim offsets and frame pivots. The completed stack is rear pieces → canonical base → body → body-scoped foreground → clipped accessory → headwear → head-scoped foreground. Accessory authoring references are never drawn over a dressed torso. No old body-box stretching, oval sleeve patches, generic face clipping or ground-to-riding garment fallback remains in the production renderer.

Mall outfits, outfit cards, photo booth and riding previews use the same renderer. Connected café walking, lunch and celebrations render the whole fitted actor, keeping every layer under one transform. Adventure uses its existing atlas transform for the matching back/front layers and preserves native carried-object ordering and standalone costume selection. Hub movement and wheels previews select bike/skateboard frames directly from four-frame clocks, independent of the six-frame walking cycle.

The earlier five-pose trial remains at `trials/fit-v1/`. Its current-fit comparison uses a saved copy of the old renderer so the comparison stays meaningful after production integration. It does not write player saves or ship in the Pages game package.

Validation includes 326 supplied file hashes, 680 exact decoded RGBA atlas reconstructions, 19 canonical base fingerprints, 21 frozen trial files and unchanged catalogue contents. Independent Pillow compositions check all 874 single-item/facing cases plus 342 representative outfit/facing cases against the running renderer; maximum channel difference is two levels from browser alpha rounding. Tests exercise both four-frame rides during actual movement.

The navigation eye/muzzle samples now use anatomical muzzle centres for the raised-head celebration poses. Small headwear foreground antialias changes are allowed at the sampled edges; body/accessory tolerance remains strict. These samples supplement the pixel oracles and visual screenshots rather than substituting for fit review.

Focused browser checks cover actual café/adventure walking, carried meals/treasure, celebrations, native and shared save retention, legacy separate origins without CORS headers, WebKit, picture menus, bowling, photo album, phone layouts and portrait suspension. The native engine/offline checks and project-subpath release checks also run. Results and selected screenshots are in `tests/wardrobe-production/evidence/`.

These are browser integration checks. Physical-phone performance, child review and exhaustive visual review of every cross-slot combination remain unverified. Shared-world offline support and device sync remain outside this update.
