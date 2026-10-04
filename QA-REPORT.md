# Sneaky Unicorn: Rainbow Restaurant v1.2.0 — QA report

Build date: 2026-10-03  
Baseline: v1.1.0  
Status: release candidate passed the automated checks described below. Nothing was deployed.

## What was actually tested

### Deterministic production rules — PASS 13/13 groups

Executed with Node v22.16.0 against the shipped `src/engine.js`.

Coverage includes:
- exactly nine menu items and two order-relevant variants per item (18 combinations total);
- all 18 combinations through serve → eat → dirty table → guest leaves → dirty-dish pickup → wash → table released;
- all three cupcake sprinkle decorations remain free decoration and do not affect correctness;
- wrong ingredient variant, wrong dish and wrong table retain the meal without a penalty;
- dirty tables cannot be reused until the dish is returned and washed;
- nine-meal day completion and new-day preservation;
- v1.1 pending-order/cooking migration and completed-seven-meal migration into the two new dishes;
- corrupt/unavailable-shaped saves safely rejected;
- pathfinding to kitchen, sink and all five service points without entering collision obstacles;
- snapshot isolation.

Machine-readable record: `tests/engine-results.json` in the editable-source package.

### Chromium production UI — PASS 14/14 groups

Executed with Chromium 144.0.7559.96 through Playwright. The exact shipped HTML/CSS/JS was run with `page.set_content` because direct local/HTTP browser navigation is blocked by administrator policy in this environment. Requests for the package's image files were fulfilled from the actual build directory. No browser security permissions or policy were changed.

Verified in that browser harness:
- six picture-only customization stages, immediate live preview and picture open action;
- a natural first guest lifecycle through arrival, order, cooking, carrying and correct table delivery;
- no accidental meal carry caused by the final cooking tap;
- all nine dishes cooked/served through actual picture buttons (one order variation per dish in browser coverage), including pancakes and smoothie;
- all three free cupcake sprinkle choices;
- visible pizza topping placement, soup vegetable fill/stir swirls and ice-cream scoop stacking;
- wrong ingredient and wrong-dish side-by-side visual compare plus remake/keep recovery;
- clear dish → carry to sink → rub/tap wash → sparkle → table release;
- mouse drag, keyboard movement and touch-pointer cancellation paths;
- partial persistence, v1.1 migration and corrupt-save fallback using an explicitly labelled Storage-compatible in-memory persistence shim across document recreation;
- a genuine unavailable-storage condition (`about:blank` localStorage denial) stays playable;
- protected parent reset requires two explicit actions;
- currently visible DOM images decode to real pixels;
- no uncaught page exceptions or console errors in successful runs.

Responsive production scenes: **24/24** across 320×568, 390×844, 430×932, 568×320, 844×390 and 1024×768, each in customize/world/cook/wash states. Visible controls remained at least 44 CSS px and within the viewport in this coverage.

A separate safe-area browser check explicitly injected iPhone-like CSS insets (390×844 with 47 px top/34 px bottom; 844×390 with 47 px left/right and 21 px bottom) and passed **8/8** customize/world/cook/wash scenes with all visible buttons inside the simulated safe rectangle and at least 44 px. This is CSS-inset simulation, not physical notch/Dynamic Island hardware verification.

Important precision: wrong-table handling is covered by the deterministic production-engine test, while the browser run verifies correct table delivery/markers and wrong ingredient/dish visual comparison. A synthetic wrong-table canvas hit test was not counted as a browser pass because it was unreliable under the `set_content` harness.

Machine-readable record and screenshots: `tests/browser-results.json` and `tests/*.png` in the editable-source package.

### Static runtime/assets — PASS 5/5 groups

Exact production file inspection verified all index-relative references, Pillow decoding of all 57 WebP/PNG production images, v1.2 semantic markers, relative PWA manifest behavior, and no external runtime URL/tracker endpoints (the W3C SVG namespace string is markup metadata, not a network endpoint). Machine-readable record: `tests/static-results.json`.

### Local HTTP byte integrity — PASS 74/74 files

A local Python HTTP server returned every current production-build file byte-for-byte identically to disk; image responses were decoded during this check where applicable. This is an HTTP transfer/package integrity check, **not** browser navigation. Machine-readable record: `tests/http-results.json`.

### Offline/package logic — PASS 9/9 groups

Executed with a Node service-worker/Cache API harness against the shipped `sw.js` and manifest. It verifies the 68-item nested-path-safe precache, scoped old-cache cleanup, cached/offline navigation behavior, all 57 artwork assets, external/out-of-scope request non-interception, local icons/manifest, and the standalone embed/suppression behavior.

This is **not** a real browser service-worker installation or true device offline-relaunch test. Machine-readable record: `tests/offline-results.json`.

## Production defects repaired during this pass

- Added a global `[hidden]{display:none!important}` rule after a CSS regression let flex/grid declarations override the HTML `hidden` attribute and cover the restaurant/customization screen.
- Raised small phone/landscape controls to at least 44 px in tested layouts.
- Constrained cooking/washing grid tracks so the sink wash action remains visible at 1024×768 and smaller viewports.

## Not verified / limitations

The following were **not** physically or natively verified and are not claimed as tested:
- physical iPhone/iPad hardware;
- Safari/WebKit rendering or touch/audio/haptic behavior on an actual iPhone;
- Add to Home Screen installation;
- native-origin browser localStorage persistence across a real hosted reload (browser persistence logic was tested with the labelled shim described above);
- real service-worker installation/update lifecycle in a navigated browser page;
- true installed web-app offline relaunch;
- notch/Dynamic Island combinations beyond CSS safe-area declarations and viewport simulation;
- speaker/audio quality or hardware vibration.

Direct browser navigation to local/HTTP URLs was blocked by environment policy (`ERR_BLOCKED_BY_ADMINISTRATOR`), so no claim is made that the browser was navigated to a hosted copy. The production files themselves were executed in Chromium as described above.

## Privacy/security boundary

Runtime inspection found no external runtime dependency, analytics, advertising, payments, account system, child name field or intentional external data collection. The service worker handles only same-origin requests within its own project scope.
