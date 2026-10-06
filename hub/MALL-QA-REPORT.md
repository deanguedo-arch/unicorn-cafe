# Unicorn Mall local candidate — verification, 2026-10-05

The approved shopping and first-connected-world plan is implemented. Following the picture-menu and scene reviews, this revision uses restaurant-style generated illustrations, uncluttered entrance/exit cues and corrected clothing fit. Dean subsequently authorized replacing the existing GitHub Pages café entry with [Unicorn World](https://deanguedo-arch.github.io/unicorn-cafe/). The [usual-browser local review](http://localhost:8790/hub/?legacy=1&art=3) remains available with `python3 hub_preview.py` running. The upper neighbourhood path leads to the shopping street, mall and separate shop scenes. Independent café and adventure launches remain available.

## Implemented loop

The hub owns a transactional wallet and permanent inventory. Existing café coins credit once; café payments add 1 and legitimate adventure wins/replays add 3. Purchases deduct coins, grant ownership and equip together, with durable receipts preventing repeated charges or rewards. Native earned-history counters and save keys remain intact. Native-origin outboxes and a write-ahead journal recover earnings interrupted before acknowledgement. Native reset keeps shared purchases and the one-time import record.

The boutique/fitting room have three clothing categories, three free starter pieces, nine purchasable pieces, free unaffordable try-on, owned-item wear, three picture outfit cards and one wishlist goal. Leaving the fitting room restores the owned outfit; buying the wishlist item clears that goal. The same backpack is available throughout the connected world. It has clothes, outfits and equipment tabs and no capacity limit. The photo booth saves actual outfit pictures in a small local album.

The wheels shop offers free trials and permanent skateboard/bike purchases at 15/25 coins. Movement boosts are 20%/35% on neighbourhood routes, shopping street and test track. Equipment parks indoors, stays owned, and leaves adventure movement and treasure capacity unchanged.

Star Catcher is a playable 30-second, 20-star basket game. Bowling has draggable aim, three throws and ten reset pins per throw. Both charge one coin and return 0/1/2 according to the approved thresholds. The library has 48 distinct illustrated compositions, eight per theme, all at 4/9/16 pieces, with snapping, optional guide, no timer, separate saved progress and free unfinished-puzzle resumption. Completion returns the jigsaw entry coin; completed replay is a new paid session. Each finished arcade session earns one stamp, with a selected exclusive cosmetic awarded after five stamps. Six prizes are available.

Phone play remains landscape. Portrait clears held controls and suspends the same activity; returning to landscape restores it. Main shopping, puzzle-start, next-piece, photo and bowling actions stay at the lower right. Small-screen game rounds use nearly the full screen; tested action buttons are at least 44px. Difficulty choices show piece grids as well as numbers. The world mute reaches both native games while preserving their own sound preferences.

Every world scene uses small cream/gold hoofprints at its existing entrances, generous approach areas and a soft highlight only nearby. Tapping the doorway or hoofprints walks there; the bottom-right picture action explicitly enters. Each place has one small floor exit arrow. Walking onto it and stopping for 0.36 seconds returns to its parent; its action button can return immediately. Arrival, reload, pause and portrait rotation disarm/reset exit dwell to prevent loops. Oversized rugs, repeated signs and extra floating doors were rejected in review and are no longer drawn.

The connected café and all nine adventure maps have reachable floor return areas using the existing checked save/pause acknowledgement. The café cue sits beyond all five dining-table interaction areas; the original pictured door also routes there. Native cooking, treasure goals, carrying and movement rules stay intact. The daytime house cue sits above its painted entrance wall; no map illustration or collision definition was changed. Necklaces/scarves anchor below the muzzle, ordinary garments/accessories clip behind the original face/mane, and helmets leave the eyes clear across walking, riding and celebrations. Glasses retain their intentional clear lenses.

## Recorded automated checks

All checks used fresh isolated browser contexts. The player's browser storage was not read, seeded or cleared. Native-game completion/customer fixtures exercise real earning hooks; arcade score fixtures test thresholds separately from real pointer play.

This revision passed **85 named checks**, plus their internal assertions and **722 face-pixel render comparisons**:

| Suite | Named checks | Coverage |
|---|---:|---|
| Generated picture menus | 10 | All 25 items, 36 controls, 66 garment poses and eight riding frames load; 852×393 and 568×320 landscape layouts; illustration containment; padded toolbar buttons; lower-right owned/unowned shopping and arcade controls; actual mouse and touch bowling aim, visible impact, reset pins, interrupted paid-round resume, duplicate reward protection, free demonstration, portrait pause; fitted photo saving; restaurant second toolbar and diamond clearance; complete clothing/riding review sheet. |
| Mall browser | 18 | Actual import/earning bridges, try/buy/wear/reload, duplicate earning/purchase protection, all 48 distinct pictures, actual puzzle drag/snapping/resume/refund, separate difficulties, bowling/catcher, equipment trial/boost, reset preservation, four landscape sizes and unavailable storage. |
| Recovery and mobile | 8 | Acknowledged requests, failed outbox/native writes, recovered earnings, actual IndexedDB abort rollback, lower-right controls, 16-piece real touch/cancel/rotation/free resume and cosmetic prize/duplicate finish. |
| Appearance/audio/standalone | 8 | All eleven canonical bounds, actual clothing during native walking/carrying/celebrations in both directions, world mute with native preferences preserved, UUID fallback and independently generated café play without world dependencies. |
| Browser compatibility | 2 | Chromium with the original separate native origins and deliberately absent CORS headers on hub resources; WebKit with the same-origin preview. Both games, actual movement, backpack/outfit changes and the puzzle library. |
| Entrances, exits and clothing fit | 22 | Actual tap-to-walk approaches in all nine world scenes; explicit entry, generous areas, all eight parent exits, arrival/reload/pause protection; 568×320 controls; 722 walking/riding/celebration renders in both directions; actual café return carrying a meal and adventure return carrying treasure; all five café table actions and tapping its original door; reachable exits in all nine adventure maps; checked return messages, retained wallet/ownership/outfit and independent standalone navigation. |
| Connected hub regression | 17 | Café navigation, cooking/save/pause/reentry, adventure carrying/in-flight position/completion/reload, interrupted entry, touch cancellation, six landscape sizes, portrait suspension, background pause and standalone launches. |

Current screenshots, per-suite results and the combined [verification record](tests/mall/evidence/navigation/VERIFICATION.json) are in [tests/mall/evidence/navigation/](tests/mall/evidence/navigation/). Runtime exceptions and missing-asset lists are empty. JavaScript syntax, Python parsing, CSS parsing and whitespace checks passed. The canonical asset/engine preservation comparison passed. The navigation suite walks the actual routes; the larger wardrobe sheet also provides manual visual evidence for necklace, scarf, bag, helmet, clear glasses, cape and riding combinations.

The release also passed 30 native café engine checks, nine original café offline-package checks, four world-package/checksum/root-worker checks and five real browser release checks. The latter use the actual GitHub `/unicorn-cafe/` subpath, both checked bridges, actual café earning, adventure movement/win reporting, purchase/equip/reload and portrait/landscape behavior. A real isolated cached café installation updated to the world while preserving its native coins, unrelated storage/cache and exactly one import. [Release browser results](tests/release-evidence/QA-RESULTS.json) and [package results](tests/release-package-results.json) record this evidence. These checks do not read or reset the player's browser storage.

The initial mall candidate's 112 functional checks are retained in [the earlier verification record](tests/mall/evidence/VERIFICATION.json). Its flat wardrobe/menu art was rejected in visual review; those earlier checks do not establish acceptance of the visuals. The previous generated-menu revision's 46 checks and captures remain in `tests/mall/evidence/v2/` as history. Current hub regression checks are refreshed; the earlier café-engine/adventure-mechanics regression evidence remains historical. The current revision changes appearance, connected return navigation, mall activity controls and toolbar/ticket spacing while retaining their native mechanics and saves.

## Source and illustration preservation

[Current preservation evidence](tests/mall/evidence/navigation/PRESERVATION.json) confirms the unchanged café engine, all eleven canonical unicorn sprite files, unchanged adventure embedded illustration data and complete level definitions, unchanged native keys/schema, all six mall scene PNGs and exact village PNG hash `1b60048baaf89114c4e312e3cf8ff25a6aa727db083e761b3e6158967466b934`. Changes in the native files are connection, earning, session audio, appearance adapters and connected return cues. Canonical images, recipes, levels, carrying and opponent rules were retained. The clothing adapter accounts for the adventure's 192px padded cell and `(96,184.5)` foot pivot, versus café/world cropped sprites. Eleven measured pose anchors follow idle, running and celebration frames without changing the images or carried-object draw order.

Six new scene images were made with the **built-in image generation tool**, using the original village as the reference. Final workspace files are:

- [Street](assets/mall/street.png)
- [Mall concourse](assets/mall/mall.png)
- [Boutique/fitting room](assets/mall/boutique.png)
- [Wheels shop/practice track](assets/mall/wheels.png)
- [Arcade](assets/mall/arcade.png)
- [Photo booth](assets/mall/photo.png)

The final [prompt set](assets/mall/PROMPTS.json) and [generation provenance](assets/mall/PROVENANCE.json) record prompts, exact hashes and original generated-image paths. The 48 puzzle pictures are distinct canvas compositions using these scenes and preserved canonical unicorn/prop illustrations; they are not 48 separate image-generation outputs. [Puzzle provenance](assets/puzzles/PROVENANCE.json) records all 29 unchanged extracted adventure assets. Clothing and picture controls now use production raster sprites made with the **built-in image generation tool**:

- [Wardrobe catalogue](assets/wardrobe/catalogue-v2.png), six garment sheets (66 pose variations), clear eyewear and two four-frame riding sheets in `assets/wardrobe/`.
- [Control atlas](assets/controls/source/controls-v2.png), individual controls, bowling lane/pin and catching basket in `assets/controls/`.
- [Wardrobe prompts](assets/wardrobe/PROMPTS.json), [wardrobe provenance](assets/wardrobe/PROVENANCE.json), [control prompts](assets/controls/PROMPTS.json) and [control provenance](assets/controls/PROVENANCE.json) preserve the generation route, references, original-output paths and exact hashes.

The current [hoofprints](assets/navigation/floor-footprints.png) and [exit arrow](assets/navigation/floor-exit-arrow.png) were also generated with the **built-in image generation tool**, using the village style reference. [Navigation prompts](assets/navigation/PROMPTS.json) and [provenance](assets/navigation/PROVENANCE.json) retain the current atlas/output hashes and the rejected oversized-mat proposal as unused history. `tools/build-navigation.py` packages exact alpha-preserving crops; it does not repaint the source or scene backgrounds.

`tools/build-sprites.py` performs exact alpha-preserving sprite crops only. `assets/wardrobe/BUILD.json` fingerprints all packaged images; `shared/sprites.js` records their rectangles. Native unicorn pixels stay intact. Clothing follows each original pose; caps and eyewear use measured anchors and transparent interiors. Capes draw behind the unicorn, front garment/accessory layers clip outside the original face/mane, and carried objects keep their original draw order. Each combination is assembled from these fitted pieces. Bikes/skateboards use illustrated riding poses rather than a detached vehicle underneath the standing character.

The menus reuse the restaurant's cream illustrated tiles, purple backgrounds, picture categories and clear previews. Outer and restaurant toolbar controls have space around their icons; the order-card diamond is below the picture content. Puzzle pictures stay inside their tiles; the photo preview fills its frame. Bowling shows drag aiming, a visible roll and knockdown before each fresh pin set. Its free demonstration cannot change money or stamps.

Representative current views:

- [Clean village entrances](tests/mall/evidence/navigation/village-852x393.png)
- [Clean arcade entrances and exit](tests/mall/evidence/navigation/arcade-852x393.png)
- [Small landscape mall](tests/mall/evidence/navigation/mall-568x320.png)
- [Landscape boutique](tests/mall/evidence/navigation/picture-menus/boutique-852x393.png)
- [Bike preview on a small phone](tests/mall/evidence/navigation/picture-menus/bike-568x320.png)
- [Bowling preview](tests/mall/evidence/navigation/picture-menus/bowling-preview-852x393.png)
- [Visible bowling impact](tests/mall/evidence/navigation/picture-menus/bowling-visible-impact.png)
- [Restaurant toolbar and order diamond](tests/mall/evidence/navigation/picture-menus/restaurant-toolbar-ticket-852x393.png)
- [All accessory combinations and riding poses](tests/mall/evidence/navigation/wardrobe-fit-all-poses.png)
- [All bodywear poses](tests/mall/evidence/navigation/picture-menus/all-clothing-and-riding-poses.png)
- [Café return while carrying a meal](tests/mall/evidence/navigation/cafe-exit-and-necklace.png)
- [Adventure return while carrying treasure](tests/mall/evidence/navigation/adventure-exit-and-necklace.png)
- [All nine adventure exit placements](tests/mall/evidence/navigation/adventure-exits/MAPS.json)
- [Fitted photo preview](tests/mall/evidence/navigation/picture-menus/photo-852x393.png)

## Human review and later work

This is local/browser proof, not physical iPhone/Safari or child acceptance. WebKit automation is not a test of her actual device. Review shopping without reading, piece-grid selection, puzzle resumption, clothing fit, vehicle feel, audio, touch targets and the landscape gate on her usual device.

[hub/README.md](README.md) gives a same-Wi-Fi phone-preview command. That address/device has its own browser profile and starts fresh; use a consistent address and browser. The legacy desktop link retains access to the older native origins and saves. Neither preview migrates them. Automatic sync, reconciliation of later standalone earnings and full-world offline caching remain later work. The original adventure's unfinished level is retained within a live tab, but does not resume mid-level across a browser reload; its native rule is unchanged.

Publication was explicitly authorized after the local reviews. `build_world.py` packages the connected world in the established `game/pages/` folder; the existing GitHub Actions workflow remains unchanged. The rebuild command validates the world package, and the café's original offline checks use its separate `game/cafe-pages/` export. The new root entry opens the world, and the replacement worker only retires the old café root cache. Both native games remain independently launchable and their shared scripts use the checked project base URL. The original café builder and standalone export remain available. Full shared-world offline caching and automatic sync are still later work.

The earlier two-door QA report, manifest and original screenshots are retained as historical evidence. [MALL-MANIFEST.json](MALL-MANIFEST.json) fingerprints this revision's source, new assets and selected current evidence.
