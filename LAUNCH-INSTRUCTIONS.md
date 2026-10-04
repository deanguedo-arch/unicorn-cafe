# Sneaky Unicorn: Rainbow Restaurant v1.2.0 — launch / preview

## Fast preview

- **Standalone:** open `Sneaky-Unicorn-Restaurant-v1.2.0.html` directly in a modern browser. It contains the game code and its 57 production WebP images in one file. Service-worker/PWA installation is intentionally disabled in this one-file edition.
- **GitHub Pages:** extract `Sneaky-Unicorn-Restaurant-v1.2.0-GitHub-Pages.zip` and upload the **contents** to a repository so `index.html` is at the repository/root publishing folder beside `assets/`, `src/`, `icons/`, `manifest.webmanifest` and `sw.js`. Enable GitHub Pages from that branch/root. No build command is needed.
- **Local hosted preview:** from the extracted Pages folder run `python -m http.server 8000` and open `http://localhost:8000/`.

## iPhone web app

After the Pages site is served over HTTPS, open it in Safari and use the browser's Add to Home Screen flow. The package includes a manifest, Apple touch icon, safe-area CSS and a versioned service worker. The release was not physically verified on an iPhone; see `QA-REPORT.md` for the exact test boundary.

## Play

The child-facing flow is pictorial: choose six restaurant looks, open the doors, approach a customer, take the picture order, enter the kitchen, make the meal, carry it to the matching table marker, let the guest eat, clear the empty dish, and wash it at the sink. One large changing picture action handles order/kitchen/carry/serve/clear. A small parent menu contains mute/motion/customize/collection/reset options.

## Save behavior

Progress is local to the browser/device. v1.2.0 can migrate supported v1.1.0 saves automatically. Clearing browser/site data clears the save. If storage is blocked or corrupt, the restaurant remains playable without saving.

## Privacy / network

The runtime has no ads, accounts, analytics, payments, child-data fields, or external runtime dependencies. After first successful hosted cache installation, the service worker is designed to serve the packaged runtime offline. True installed-PWA offline relaunch was not available to test in this environment.
