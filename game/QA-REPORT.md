# v2.0.0 independent Codex verification

The finished build is generated from the separate `working-v2` copy of the verified v1.4 handoff. The recent v1.6 concept experiment was not treated as a final implementation. Earlier releases, four handoff ZIPs, source originals and unselected image-tool candidates remain preserved outside this release.

## Verified implementation

Six visible startup design categories with a separate tablecloth selector and live preview; saved options preselected on every launch. Five complete illustrated tables with independent chairs/props and permanent picture markers. Original canonical character pixels retained. Selected regular ChatGPT B sink and matching kitchen are isolated runtime sprites; coherent painted food states/components supply all nine cooking screens, menus, orders and served meals. Pizza placements persist, icecream scoops stack, cupcake decorations remain free choices. Kitchen hit area and sink approach/cleanup/wash overlays match the new art.

The ten-guest day retains a gentle varying pace, physical stopped-near interactions and picture assist, full serve/eat/dirty/return/wash lifecycle, a five-guest lunch with three bites/two sips, five afternoon guests, nine wipe surfaces followed by six floor zones, and gated celebration/replay. Existing save key/schema and older-key migration are preserved.

## Evidence

- `engine-results.json`: 22/22 deterministic rules tests. All18 recipe variants, wrong choices/tables, dish/table reuse gates, lunch/cleanup/reload, pacing, reachability, corrupt saves and repeat days.
- `browser-core.json`: 9/9. Actual standalone file loaded in isolated Chromium; all33 customization options, six visible categories/preview, keyboard approach/dwell, serving, washing, gentle remake, preferences, protected reset and decoded artwork.
- `browser-recipes1.json`, `browser-recipes2.json`: 18 recipe variants via actual buttons, explicit carry and physical approach/dwell; no page errors. Every finished food uses the matching production renderer.
- `browser-day.json`: lunch controls and save/reopen; all nine surfaces/six floor zones; gated celebration, replay, partial cleaning reload and rubbing without click-through.
- `production-daily.json`: actual production controls across all ten guests, nine recipes, lunch, washing and every cleanup task. QA directly spawns guests, completes eating/exit waits and sets approach positions to accelerate the run; it does not claim unassisted child play.
- `browser-layouts.json`: eight viewport sizes, 320×568 through1024×768, portrait/landscape. `cooking-layouts.json`: 72 recipe choice/ready states at four phone dimensions; interactive controls are at least44×44, contained and unobscured by hit-testing.
- `station-reentry.json`: actual keyboard exit/return re-engages; staying at the station after closing its menu does not repeatedly reopen it.
- `browser-extra.json`: 8/8. Real isolated browser localStorage for migration/corrupt saves; old save bytes unchanged; emulated touch lunch/mop; synthetic pointer-ID regression; simulated CSS safe areas; next-day replay.
- `static-results.json`: 7/7 syntax, Pages/standalone equivalence, alpha/images, preserved original pixels, no external game requests and hosted byte checks. Asset provenance directly compares every prior113 asset against the recovered archive:111 unchanged; only kitchen/sink replaced. Live asset count161.
- `offline-results.json`: 9/9 mocked worker/cache rule checks, explicitly a simulation. `pwa-real.json`: actual local Pages service-worker installation, offline network setting, reload, and picture Play succeeded.
- `v2-*` PNGs: actual independent game screenshots, inspected for designer, restaurant, food art, compositing and washing. No concept poster is used as an interactive screen.

Final archive checks and extracted production-file smoke evidence are recorded in `RELEASE-MANIFEST.json` and `package-verification.json` beside the deliverables.

## Limits

No physical iPhone, Safari Home Screen installation, or five-year-old usability session was performed. Phone checks use desktop Chromium viewports/emulated touch; safe-area values are simulated. Browser fixtures are stated above. No push, deployment or public publishing occurred. Saves remain local to the same browser/site origin; opening a new file or different hosted origin does not transfer them.

## 2026-10-04 landscape phone visual correction

Inspected the built game across 568x320, 667x375, 740x300, 844x390 and 932x430 viewports, plus 740x300 with 44-pixel side insets and a 20-pixel bottom inset. The regression audit passed 540 screen states with zero clipping, small/covered controls, image-containment failures, or browser errors. Every cooking step, alternate flavour and cupcake decoration was included. Screenshots were visually reviewed for the designer, world HUD, recipe menu, food preparation, washing, lunch, cleaning, comparison dialogs, settings, collection and completion.

Fixed offscreen cupcake decoration choices, food/control overlap, oversized sprinkle indicators and wash-ticket symbols, clipped order tickets, recipe tiles exceeding short viewport height, and hidden completion/collection actions. Cooking controls now have a dedicated row, and food tiles scale against both available width and dynamic viewport height. Completion artwork and recipe pictures share a compact row.

A separate actual UI playthrough cooked and carried all 18 recipe/variant combinations at 568x320 (214 preparation clicks), including all three cupcake decoration choices. Engine and offline package checks passed. Evidence is in `tests/mobile-visual/`; reproducible checks are `tests/mobile_visual_check.cjs` and `tests/mobile_recipe_play.cjs`. This is Chromium viewport simulation, not physical iPhone/Safari certification.

## 2026-10-04 customer order and workbench redesign

Replaced the cooking-screen ticket with a larger persistent order card: customer/table together at the top, a dominant finished-food picture, the dish name, and an explicit flavour picture/label. The requested order stays visible while children select ingredients and prepare their own dish. All flavour and decoration choices now have short visible labels.

The workbench is the main preparation control, with a contextual ingredient/tool, a plain action label, an arrow pointing toward the food, and progress dots. Ready meals have a larger labelled carry action. Vanilla and strawberry scoops use the selected flavour's artwork; soup vegetables and poured smoothies also use the selected ingredient. The existing recipes, actions, saved-state schema and customer requests are preserved.

The updated visual audit passed all 540 simulated landscape states, including image containment for the new order card. All 18 recipe/variant combinations were cooked and carried through actual 568x320 UI clicks, with additional verification that scoop artwork matches the selected flavour. New order/workbench screenshots are in `tests/mobile-visual/`. Physical-device and child-usability review remain separate from these automated checks.

## Ice-cream picture containment fix

The former three-scoop composition reached above the 320x280 food canvas, clipping the top scoop before CSS could fit the picture into a card. Normalized the complete composition into that frame and generated tightly framed portrait ice-cream card images with eight transparent pixels of padding on all four sides. Asset files and recipe/save data are preserved.

`tests/icecream_fit.cjs` passed 14 pixel-level checks: strawberry and vanilla at six preparation states are compared against a larger reference canvas to detect lost pixels; both finished card pictures also have a portrait frame and clear padding on every edge. The full 540-state landscape layout audit and all 18 recipe/variant UI playthroughs passed again after this change. Pixel results and small-phone screenshots are in `tests/mobile-visual/`.

## Round action button and portrait recipe tiles

Removed the action button's browser padding and sized its main picture relative to its inner circle. Table medallions now use a single badge instead of nested frames. All 18 carried food variations passed centering, containment, single-badge and screen-bound checks across four viewport sizes plus simulated safe areas (90 states).

The tightly framed ice-cream image exposed a separate recipe-tile layout issue: percentage image heights inside an aspect-ratio grid cell could resolve to the portrait image's natural height. Recipe pictures now occupy an explicit inset frame inside each square button. The mobile visual audit now checks recipe-tile image containment as well; the earlier audit did not include those images. All 540 states passed with the expanded check. Physical iPhone/Safari review remains outside this Chromium simulation.

## Picnic, floating controls and compact orders

Removed the full-width brand/header strip from gameplay. The stars and settings button float over the restaurant, giving the stage the full available screen height. Settings uses six labeled picture buttons. The lunch scene uses the restaurant's selected wall, floor and furniture, with smaller characters gathered at its table and no full-width header or side panel.

Lunch now starts with three sequential picture matches: pack the chosen meal, fruit and milk. Wrong selections leave progress intact; there is no timer. Then the existing three bites and two sips complete the break. Packing progress saves after each match. Existing lunch saves without the new `packed` field resume with their previous eating/drinking progress and skip packing; the save key and schema are unchanged.

Large simultaneous order bubbles are replaced by interactive table medallions. One pinned picture card shows the selected order. Tapping another ordered table's medallion selects its card without sending the player walking; the main action still starts cooking or delivery. The selected medallion has a gold ring. Markers have 54-pixel hit regions and avoid the floating controls and one another.

Validation: 24 deterministic engine checks and nine offline-package checks passed. The expanded mobile audit passed all 558 states across five landscape sizes plus simulated safe areas, including every picnic-packing stage. `tests/picnic_play.cjs` passed 15 actual UI cases: all four lunch choices at three phone sizes, reload after every pack/bite/sip at 568x320, settings during lunch, and switching selected orders in five-customer fixtures. Reports and inspected screenshots are in `tests/mobile-visual/`. These checks use Chromium simulation, not a physical iPhone or a child usability session.

## Mop movement and simpler title

Surface cleanup retains its scrubbing activity. After the surfaces are clean, the player collects the mop beside the sink. The unicorn carries a single illustrated mop, walks to floor patches using the existing movement controls, and cleans with explicit presses of the round action button. Walking across dirt alone does not clean it. Each patch needs four strokes; crumbs disappear as progress increases. The last patch was moved clear of the action button so it remains visible and tappable.

Mop ownership and cleanup progress persist through reload. Existing saves retain their completed strokes; saves without mop ownership require collecting it. The save key and schema are unchanged. The old unicorn logo markup was removed in favour of the plain Rainbow Restaurant name; the floating gameplay HUD retains its compact layout.

Validation: 25 engine checks and nine offline-package checks passed. The mobile visual audit passed 576 states across five landscape phone sizes plus simulated safe areas. `tests/mopping_play.cjs` exercised actual pointer movement, explicit pickup, six reachable floor targets, 24 button strokes, saved progress/reload and the final completion dialog without browser errors. The carried mop screenshot was visually inspected. Reports and the screenshot are in `tests/mobile-visual/`. Browser checks use Chromium simulation, not a physical iPhone or a child usability session.

## Seated restaurant guests and painted tables

Five new transparent seated sprites use the existing pink/blue unicorn, child, worker and manager as identity references. Five painted table sprites retain round, oval, clover, heart and cloud choices while matching the kitchen's plum wood, gold edging and cream fabric. Cloth colours and gingham/rainbow patterns are applied to the neutral fabric; all 30 shape/cloth combinations remain distinct. Existing character frames and table source files are preserved. Generation prompts, source paths and export details are recorded in `artwork/seated-dining-source.json`; originals remain unchanged. Runtime WebP exports are in `build/assets/`.

Stationary customers sit in the right chair while waiting, ordering and eating, then stand and walk out. Chairs, seated guests and table fronts render in that order, with walking actors sorted against furniture. Chair spacing keeps faces visible. Service points sit beside the occupied chair; ordering and serving require a 55-world-pixel approach to those points. Table footprints include the wider chair spacing. Existing saves anchor stationary guests to the new seats while preserving orders, dishes, progress and customization. The save key and schema are unchanged.

Validation: 26 engine checks, nine offline-package checks and all 576 simulated mobile visual states passed. `tests/seated_dining_play.cjs` checks actual UI approaches and serving at five tables from outside the interaction range, exit paths, arrival from the entrance, reload, all five seated sprite draws and 30 distinct customization previews. The mopping UI regression still completes all six patches and 24 strokes. A five-customer restaurant screenshot was visually inspected for chair seating, face visibility, meal placement and table style. These checks use Chromium simulation and accelerated customer fixtures, not physical iPhone or child usability testing.

## Seated visibility and furniture proportions

Reduced world table width about 20 percent and height about 23 percent, enlarged chairs about 33 percent, and increased seated character scale to keep their heads comparable to walking characters. Occupied chairs sit at the front corners. Tables now render before seated guests, so the table cannot cover their face, lap or bent legs. The chair cushion lines up with each pose; baby and human poses use different foot offsets. Props and served meals were reduced to fit the smaller top. Approach points moved in front of the occupied seats; saved stationary customers resume at the adjusted anchors without losing orders.

The dining UI playthrough passed for all five tables, including arrival, taking orders, serving, departure and reload. A new production-canvas pixel comparison checks all five seated characters against each of the five table shapes: over 99.9 percent of the visible opaque character pixels remain unobscured in the tested scene. The heart table and sky chairs shown in the user's photo were also visually reviewed. All 576 simulated mobile states, 26 engine checks and nine offline checks passed. Evidence: `tests/mobile-visual/seat-fit-heart-sky.png` and the updated seated dining report. Chromium simulation remains separate from physical-device review.
