# Verification record — Rainbow Restaurant v1.1.0
Date: 2026-10-03

## What was actually exercised

**62 / 62 pure-rule and navigation tests passed.** Node v22.16.0 ran the production `src/engine.js`, not a separate reimplementation. Coverage included seven recipes, all fourteen custom variants, every preparation step, per-step serialization/restoration, tray packing, successful serving, all seven wrong-variation/remake paths, wrong dish, wrong table, duplicate reward prevention, customer capacity, seven-meal completion/replay, invalid save data, and all ordered pairs of routes among the entrance, kitchen and three tables.

**15 / 15 main browser scenario groups passed.** Chromium 144.0.7559.96, Playwright 1.57.0. The complete embedded release was loaded with `page.set_content`; actual browser rendering and touch/mouse/keyboard input were used. One complete first day was played through without fixture shortcuts: customers entered, orders were accepted, all seven dishes were prepared, the avatar physically delivered each meal, the day completed and replay advanced to day two. The suite separately cooked and served all fourteen dish/variation combinations using controlled starting orders. Wrong table, wrong dish, wrong ingredient, remake, keep-carrying, restart, leave/resume, partial-save continuation, carried-meal continuation, gesture/hold input, drag/release/cancel, mute, AudioContext gesture unlock, menu/reduced motion, reset confirmation and unavailable-storage fallback were exercised.

The main suite checked **21 layouts**: restaurant, recipe picker and cooking at each of 320×568, 390×844, 430×932, 568×320, 844×390, 1024×768 and 1440×900 CSS pixels. Visible buttons met at least 44×44 CSS pixels, with larger main action and cooking buttons. Scrollable recipe lists were allowed to extend within their scrolling container. Document width overflow was checked. All 57 production assets loaded; visible DOM images decoded. No uncaught JavaScript exceptions or unexpected console errors were recorded in this final main run.

**9 / 9 supplemental browser groups passed.** These verified the final-tap/carry-button regression, actual touch swiping to the last recipe on a small phone viewport, six CSS-simulated notch/home-indicator layouts, direct order-bubble tapping with physical walking, all four camera/movement extremes, a deliberately broken artwork URI with named error and working retry, keyboard activation/modal focus, absence of HTTP(S) requests from normal standalone play, and absence of uncaught exceptions. The intentional corrupt-image test is an expected asset failure, not a normal-load success claim.

**9 / 9 offline/package logic checks passed.** Node executed the production service worker in a simulated Cache API environment with a project-subdirectory scope. Tests checked its precache file list, cache/version/scope isolation, offline cached entry and all 57 assets, query-string navigation, fallback behavior, relative manifest URLs, and non-interception of other origins/scopes or non-GET requests. These are service-worker logic tests, NOT an actual browser installation test.

**HTTP delivery/byte identity was checked independently.** A Python local HTTP server served the deployment folder under a subdirectory. Python clients fetched the shipped files and compared their bytes with the files on disk. Image decode and packaging/checksum checks are recorded with the included source test results. This is not evidence that a browser could navigate to that server in this environment.

## Repairs made before the final passing runs

A pointer release could click the newly drawn carry/choice control after a preparation tap. The stable kitchen panel now consumes only the click belonging to that same preparation gesture; a new deliberate tap works normally. The completed food remains visible until the child presses Carry.

Returning to a partially prepared meal now resumes the existing preparation rather than resetting it. Order/meal state is preserved when visiting the restaurant. Save validation repairs inconsistent issue counts. Customer seating/order-card offsets, toast clearance, keyboard button activation and full-app safe-area padding were also checked and adjusted. Adventure code and project settings were not edited.

## Important limits — not verified here

**No actual iPhone or iPad, Safari/WebKit execution, Home Screen installation, or real device offline relaunch was available.** There was no physical child playtest, device haptic assessment, audible speaker/volume assessment, or physical-notch measurement. Layout/device emulation is not equivalent to those tests.

Browser URL navigation in this environment failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR` for local HTTP and file URLs. The browser tests therefore used the exact self-contained release via `page.set_content` rather than claiming a successful hosted navigation. Attempts to obtain WebKit also failed because the browser-download hosts could not be resolved. No browser policy was bypassed.

Persistence restoration used an explicitly injected synchronous, in-memory Storage-compatible shim across **fresh pages**. It verifies save serialization and game restoration, not native-origin localStorage persistence. A separate fresh about:blank page without the shim exercised the real inaccessible-localStorage fallback. Native storage across a real navigation, browser shutdown and iPhone Home Screen context still needs a device check.

Actual service-worker registration, installation, cache activation, offline relaunch and GitHub Pages deployment were not run in a browser. The package contains the implementation; the simulation tests do not remove that integration limitation. Nothing has been deployed.

## Reproduction and evidence

The editable source archive includes `tests/engine.test.js`, `tests/offline.test.js`, `tests/browser_suite.py`, `tests/browser_extra.py`, environment information, final JSON results/logs, selected screenshots, and packaging checks. `CHROMIUM` can point the browser scripts to a local Chromium executable. The browser scripts expose QA fixtures only through their own injected QA flag. The normal shipped page does not enable QA mode.

Run a final smoke check on the intended iPhone after hosting: open online, start, accept an order, cook with both a tap and a hold/drag, carry/serve, rotate, close/reopen with partial progress, install to Home Screen, and then relaunch offline after the menu confirms caching. Keep this report's unverified items distinct from the tests above.
