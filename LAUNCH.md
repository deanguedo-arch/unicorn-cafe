# Sneaky Unicorn: Rainbow Restaurant v1.2.1 — launch and update

## Play or preview
Open `Sneaky-Unicorn-Restaurant-v1.2.1.html` in a browser for the one-file edition. It embeds the code and all 85 production WebP assets; it intentionally does not register a service worker. Local-file browser behavior can vary; the HTTPS-hosted edition is the intended iPhone route.

For GitHub Pages, extract `Sneaky-Unicorn-Restaurant-v1.2.1-GitHub-Pages.zip` and upload the extracted contents, **not the ZIP**. `index.html`, `styles.css`, `src/`, `assets/`, `icons/`, `manifest.webmanifest`, `sw.js` and `.nojekyll` belong together at the publishing root. No build command, Node install or image-generation service is required to play.

In repository **Settings → Pages**, select **Deploy from a branch**, the publishing branch (commonly `main`), and **/(root)**. Save, then use the site address GitHub displays. No repository was published or modified by this release task.

Official GitHub guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site and https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Updating your existing game
Replace the old deployment files with this ZIP's contents. The retired `assets/restaurant.webp` is no longer used; the room and selected furniture are now separate. Do not mix old `src/` or `styles.css` with the new files.

The game deliberately retains the v1.2 storage key and schema. Existing v1.2.0 `tabletop` choices map to the new `tablecloth` field; partial cooking, carrying, dirty dishes, wash progress, collection and totals remain supported. v1.1 migration is retained. To continue a saved game, use the same browser and web origin and **do not clear the site's stored data**. Storage denial/corruption still falls back to playable unsaved/fresh play.

A hosted update may need the game to be closed/reopened or refreshed after the new worker activates. The small parent menu displays **v1.2.1**, which is the check that the new build is running. The service-worker cache is versioned 1.2.1 and scoped to this restaurant path; it does not delete adventure/other-project caches.

## Tablecloth and restaurant setup
There are still exactly six picture stages: flooring, wallpaper/theme, table shape, **tablecloth**, tabletop decoration and chairs. The cloth stage has four actual draped-fabric previews: warm gold, ivory, pink and blue. Tapping a choice changes the restaurant immediately; the phone preview centres a complete table. The parent menu's restaurant-customization picture reopens setup later.

## iPhone Home Screen
Open the HTTPS site in Safari. Use the Share menu → **Add to Home Screen**, choose **Open as Web App** when offered, then Add. The package includes the manifest, icons, safe-area support and versioned offline worker. A complete first hosted load and successful cache installation are required before offline use is possible.

Official Apple guidance: https://support.apple.com/guide/iphone/iphea86e5236/ios

Physical iPhone/Safari/Home Screen installation and a true installed-app offline relaunch were **not** verified here. Read the QA report for the actual browser and simulation boundaries.

## Local development preview
From the extracted Pages folder: `python -m http.server 8000`, then open `http://localhost:8000/` in your own browser. This execution environment blocks browser URL navigation by administrator policy, so its browser tests use the explicitly documented production-code harness instead. No policies were changed.

## Privacy
No accounts, child profile fields, ads, payments, tracking, external fonts or runtime libraries. Game progress stays in browser storage. This task did not publish the website or change the existing releases.
