# Unicorn World scenic puzzles — 6 October 2026

Implemented the supplied `Unicorn_World_Puzzle_Master_Handoff.zip` in the current repository, preserving newer navigation and wardrobe work. Its source snapshots were reference material; they were not installed over current files. All 16 supplied WebP masters/thumbnails retain their exact SHA256 hashes. Original lossless PNGs remain in Library and were not needed for runtime.

## Runtime changes

- `shared/catalogue.js`: eight versioned world records and an explicit visible collection, retaining all 48 old picture IDs and independent session keys. Names, order, alt text and versions follow the supplied manifest.
- `puzzles.js`: thumbnails in the gallery, selected-master decoding before payment, retryable rejected loads, dimension validation and a two-master LRU cache. The old compositor and its own sources load only when an old paid round needs them.
- `shared/jigsaw.js`: frozen FNV-1a/xorshift32/cubic contract seeded by the new ID and piece count. Internal curves are generated once and shared in reverse. Outside edges are flat; row-major IDs remain unchanged. Curves, paths and conservative actual bounds are cached for the active cut.
- `mall.js`: eight-scene gallery, visible legacy Continue cards including difficulty, uniform full-image mapping, Path2D clipping/hit masks, one pointer, pickup offset, generous correct-target snapping, keyboard movement, picture preview, safe cancellation and a seamless completion picture. Wide loose pieces fit the tray by their actual bounds without cropping; solved pieces retain the full board scale. Gallery controls refresh when wallet/progress changes.
- `index.html` / `picture-menus.css`: geometry registration, zoom permission, accessible labels/focus and picture controls. Existing landscape rotation guard and lower-right primary controls remain.

No profile database, native-save namespace, prices, rewards, transaction receipts, wardrobe artwork or native engine changed. One coin starts, resuming is free, and completion returns one coin plus one stamp. The fixed cut version comes from catalogue/ID, not discarded session-state fields. Native games retain their existing independent offline behavior; the world root still has no first-launch offline support. A round with its master already decoded is playable offline.

## Verification actually run

- `puzzle-worlds/geometry.cjs`: frozen fingerprints for all three grids; all 24 cuts, internal edge counts 4/12/24, sampled curves without self intersections and safe bounds.
- `puzzle-worlds/browser.cjs`: all eight pictures at 4/9/16 finish through actual mouse/touch drops; refunds and repeated-finish safety; same reversed edges, flat borders and single-owner sampled board coverage; lobe pickup/socket exclusion; off-center anchors; failed decode before payment and retry; close/reload/free resume; legacy original-art resume; cache bound; high-DPI narrow-landscape controls and portrait cancellation.
- `puzzle-worlds/resilience.cjs`: zero-coin old-round resume; two actual tabs and stale-save union; all 24 clipped mosaics compared with full-master pixels; every actual piece bound fits the tray; wrong targets/near misses, pointer cancellation and second-pointer exclusion; keyboard completion, guide, full-image preview, reduced motion, mute and already-loaded offline play. Switching from a puzzle preview to bowling cannot disable aiming.
- Existing mall/browser (18), picture menus (10), mobile/storage resilience (8) and quick-switch checks passed, including wardrobe, café/adventure earning, resets, bowling, Star Catcher, equipment and save retention.
- Release-package (4) and local release-browser (5) passed, including a real cached café installation upgrading without lost native history or repeated coin import.

Screenshots are in `tests/puzzle-worlds/evidence/`: gallery, a loose tabbed piece, partial placement, seam-free completion, narrow landscape and original-art legacy resumption. Physical iPhone/Safari and child usability review remain separate from automated Chrome/WebKit proof.
