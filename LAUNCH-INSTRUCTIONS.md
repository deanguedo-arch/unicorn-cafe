# Rainbow Restaurant v1.6.0 — Launch and GitHub Pages

## GitHub Pages
1. Extract `Sneaky-Unicorn-Restaurant-v1.6.0-GitHub-Pages.zip`.
2. Upload the extracted contents to the publishing root of the restaurant repository. `index.html` must be at that root.
3. Keep `sw.js`, `manifest.webmanifest`, `.nojekyll`, `VERSION.json`, and `icons/` beside `index.html`.
4. In GitHub: Settings → Pages → Deploy from a branch → your publishing branch → `/(root)`.
5. After GitHub finishes deploying, fully close an older installed/open copy once and reopen it so the v1.6.0 service worker can replace the previous cache. Do not clear site data unless you intentionally want to erase local progress.

The GitHub Pages `index.html` embeds the game code, CSS, and artwork. It does not require an external runtime `assets/` or `src/` folder.

## Standalone preview
Open `Sneaky-Unicorn-Restaurant-v1.6.0.html` in a desktop browser. For iPhone/Home Screen use, prefer the hosted HTTPS Pages build.

## Save behavior
v1.6.0 preserves the existing `sneaky-unicorn-restaurant-v1-4` local-save key so v1.4/v1.5 progress remains available on the same browser/origin. The visual designer is now shown at startup even when a save exists; it does not wipe progress.
