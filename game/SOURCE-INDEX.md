# Editable source index

build/index.html: modular development entry.
build/src/engine.js: recipes, daily flow, saves, pacing, reachability and cleanup gates.
build/src/art.js: isolated station/furniture composition, generated production food-state renderer, animation and asset loading.
build/src/game.js: picture-led controls, six-category designer, movement/dwell, cooking/washing/lunch/cleanup screens.
build/styles.css: responsive layouts and control styling.
build/assets/: canonical retained sprites plus selected B production artwork.
ASSET-PROVENANCE.json: every live asset hash and source.
art-source/: original selected B images, exact crop maps and extraction scripts.
tests/: independent engine/browser/real-storage/PWA results and screenshots.
build_standalone.py, build_pages.py: rebuild embedded playable artifacts with Python standard library.

Older root source and release packages are archived outside the checkout; see the root README. GitHub Actions builds game/pages from build/ on every push to main. Generated outputs are not tracked.
