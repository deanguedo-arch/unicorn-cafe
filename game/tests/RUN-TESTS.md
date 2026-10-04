# Reproduce verification

From the extracted source root run Python3 build_standalone.py and build_pages.py. Run node tests/engine_tests.js, node tests/offline_tests.js, and python3 tests/static_checks.py (Pillow).

Browser QA requires Python Playwright plus installed Chromium. Set CHROMIUM_PATH to its executable. Run tests/browser_tests.py core, recipes1, recipes2, day, layouts; tests/browser_extra.py; tests/cooking_layouts.py; tests/production_daily.py; and tests/pwa_real.py. Browser contexts are isolated; do not use a personal browser profile.

Helpers load the exact standalone HTML file from disk with real browser localStorage. Fixtures and timer acceleration are stated in result reports. PWA verification serves only this package at local port8769 and disables network in the test context. Physical iPhone/Home Screen behavior and actual child usability have not been tested.

## Landscape mobile visual regression

Run `python3 rebuild.py`, then `node game/tests/mobile_visual_check.cjs` and `node game/tests/mobile_recipe_play.cjs` using a Node environment with Playwright available. Set `NODE_PATH` when using an external dependency runtime, and optionally set `CHROMIUM_PATH` to an existing Chromium executable. `VISUAL_OUTPUT` controls the visual report/screenshot directory; it defaults to `/tmp/unicorn-mobile-visual`. `GAME_URL` can point the playthrough at the hosted game; by default it loads the built standalone file.

The visual test checks all cooking steps, both flavour variations, decoration choices, designer categories, the recipe menu, washing, lunch, cleaning, comparison dialogs, settings, collection, restart/pause/reset confirmations, and completion. It includes five landscape phone sizes plus a short viewport with simulated notch/home-indicator padding. Controls must be at least 44 pixels, onscreen, reachable, and unobscured; picture content must stay inside its card, and food preparation must not overlap its controls. Fixtures and screenshots use isolated browser storage. The actual UI playthrough cooks and carries all 18 recipe/variant combinations, including all cupcake decoration buttons.
