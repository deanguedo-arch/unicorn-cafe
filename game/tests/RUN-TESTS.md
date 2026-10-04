# Reproduce verification

From the extracted source root run Python3 build_standalone.py and build_pages.py. Run node tests/engine_tests.js, node tests/offline_tests.js, and python3 tests/static_checks.py (Pillow).

Browser QA requires Python Playwright plus installed Chromium. Set CHROMIUM_PATH to its executable. Run tests/browser_tests.py core, recipes1, recipes2, day, layouts; tests/browser_extra.py; tests/cooking_layouts.py; tests/production_daily.py; and tests/pwa_real.py. Browser contexts are isolated; do not use a personal browser profile.

Helpers load the exact standalone HTML file from disk with real browser localStorage. Fixtures and timer acceleration are stated in result reports. PWA verification serves only this package at local port8769 and disables network in the test context. Physical iPhone/Home Screen behavior and actual child usability have not been tested.
