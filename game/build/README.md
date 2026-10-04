# Sneaky Unicorn: Rainbow Restaurant v2.0.0

A picture-led illustrated unicorn café game. Customize the restaurant, cook nine foods with eighteen variations, serve and wash dishes, take a lunch break after five guests, serve five more, then wipe the restaurant and mop its floor before celebration.

Open `Sneaky-Unicorn-Restaurant-v2.0.0.html` for the standalone version. The GitHub Pages ZIP contains a ready-to-host root entry with embedded artwork, styles and scripts, plus offline worker, manifest and app icons. The source ZIP contains the editable modular build and reproducible Python build scripts. No external runtime dependencies.

The v2 takeover recovered the actual latest four-part handoff. v1.4 is the gameplay authority; the v1.6 concept experiment was not an accepted final game. This release connects the approved regular ChatGPT B illustration style to actual sprites and runtime food states instead of placing concept pictures behind earlier gameplay.

No publishing or GitHub push is performed by creating these files. Prior releases are preserved. Existing v1.4 save key/schema are retained; older restaurant saves migrate without deleting their original keys.

See `LAUNCH-INSTRUCTIONS.md`, `CHANGELOG.md`, `QA-REPORT.md`, `ACCEPTANCE-MAP.md`, and `VERSION.json`.

Rebuild with Python3: `python3 build_standalone.py`, then `python3 build_pages.py`. Browser QA additionally needs Playwright and Chromium; it uses an isolated browser context, not the user's browser profile.
