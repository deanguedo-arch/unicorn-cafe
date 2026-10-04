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
