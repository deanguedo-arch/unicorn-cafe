# Full wardrobe handoff

This package is an isolated renderer and art handoff. It does not alter the canonical game, movement/facing, saves, item IDs, ownership, prices, collisions or published files.

The current canonical commit `e680b869c3e85481a0ee5904accdb51a1fb8dc00` has the same shared sports/wardrobe scripts and pose assets as the frozen `d0c139c` contract. See CURRENT_SOURCE_RECONCILIATION.json for the 45 complete hash comparisons. New mobile-gesture protection belongs to the canonical game and must be retained.

## Review

Serve this extracted folder with a local static HTTP server and open `review-index.html`. It links every pose and item family with both facings, plus six full outfits. `review.html` provides independent equip/remove selectors and a native-scale switch. Its synthetic in-memory outfits do not access user saves. The candidate skate button plays only a review timeline.

The runtime consists of `assets/manifest.js`, `full-sports-fits.js` and the PNGs referenced by `assets/manifest.json`. Source/editor files and evidence are separate. Source-cell trim offsets restore the unchanged source origin; the complete actor and wardrobe use the same ground pivot, scale and mirror. Do not center garments by their own bounds. Six phases remain rear, body, body_foreground, accessory, head, head_foreground; slot order within a phase is body, accessory, head.

## Proposed sports installation, not applied

1. Copy the contents of this package's `assets/` into `hub/assets/wardrobe/sports-full/`.
2. Copy `full-sports-fits.js` into `hub/shared/`.
3. Load `assets/wardrobe/sports-full/manifest.js`, then `shared/full-sports-fits.js` with `data-assets-root="../assets/wardrobe/sports-full/"`, after the existing catalogue/art scripts and before sports.js. The dataset URL is relative to the adapter script; the review's default remains `./assets/`.
4. Review `integration/sports.js.patch`: it adds the asset-load hook, per-actor wardrobe adapter and clean owned near-player outfit argument. Opponents retain the default null outfit. It does not change ball physics, pose timing, movement or gameplay facing.
5. Preserve the existing 437 walking/riding records and their original pack. Run the actual complete game integration checks before any publication; isolated render checks do not establish game deployment correctness.

The nine established basketball starter fits and their twelve runtime PNGs remain byte-identical. The self-contained authoring sources retain them under `source/frozen-nine-fit/`; `source/frozen-nine-geometry.json` contains the established geometry. `build_full_fits.py --items item-id,...` regenerates only selected items while preserving all other records. It requires Python with Pillow and NumPy. `check_contracts.py` verifies runtime hashes, protected regions, frozen assets and the narrow sports patch.

## Skate boundary

Four source candidates are registered in this isolated manifest as skate_crouch, skate_rise, skate_air_level and skate_land. Authored review durations are 120/100/180/140 ms (540 ms total). `drawHop()` requires an owned and selected skateboard, applies the same wardrobe phases, and uses source-to-world scale .2 at its default .4 actor scale. Artwork uses a shared y663 ground reference; the airborne board already rises to about y579. Do not apply the existing ramp sine lift a second time.

These timings, trigger and scale are proposed review data. No canonical hop controller, input trigger, cooldown, landing/collision contract or activity state has been installed. Skate art must remain review-only until that game contract is approved and verified. The current basketball game forces right-facing through movement; the isolated renderer verifies both facings but does not repair that gameplay choice.

## Scaled skate raster fix

The isolated adapter filters a complete skate actor once at device-pixel scale before a 1:1 mirrored copy. Its bounded 32-entry cache keys frame, outfit, scale and smoothing; viewport/DPR transforms are included, and caller canvas state is restored. Source pivots, ground reference, frame durations and clothing PNGs remain unchanged. Native-resolution drawing retains the original path. All 13 original timeline gates and all 183 expanded checks pass with exact comparisons; see MIRROR_FIX.md. This renderer repair does not install a canonical hop controller.
