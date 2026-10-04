# Rainbow Restaurant v1.4.0 — Launch and update

## GitHub Pages

1. Download and extract `Sneaky-Unicorn-Restaurant-v1.4.0-GitHub-Pages.zip`.
2. In the restaurant repository, use **Add file → Upload files**. Upload the extracted contents, not the ZIP or an extra enclosing folder. Commit the update to the publishing branch.
3. Keep `index.html`, `manifest.webmanifest`, `sw.js`, and the `icons/` folder together at the publishing root. This version embeds the game artwork/code/style in `index.html`; it does not need the old `assets/`, `src/`, or `styles.css` files.
4. In **Settings → Pages**, choose **Deploy from a branch**, select **main** (or your actual publishing branch), select **/(root)**, and save. No package installation or build command is needed.
5. Open the site address GitHub displays after deployment. The parent/settings menu should say **v1.4.0**.

The ZIP uses a small file count so it can be uploaded in one normal browser batch. `.nojekyll` is intentionally included; some desktop file browsers hide dotfiles.

## Updating an older restaurant installation

Replace the restaurant's `index.html`, `sw.js`, manifest and icons together. Old asset/source files are not read by the embedded build. Do not replace other games or course files.

An already-open Home Screen app can still be running the previous version until it is closed and reopened. After the update, close/reopen or reload the restaurant and check the version in settings. Do **not** clear website data to update: that deletes local saves. Nothing has been deployed automatically.

The final game uses a new local save key, `sneaky-unicorn-restaurant-v1-4`. On its first load, it looks for valid previous restaurant data in the v1.3, v1.2 and v1 keys on the **same website origin**. The prior save keys are not overwritten or removed. A finished earlier day stays finished. An older unfinished save past five meals gets a safe catch-up lunch after its already seated guests and dishes are finished; fresh days divide exactly five/five. Moving to a different domain/browser/device does not transfer local storage.

## Standalone desktop preview

Open `Sneaky-Unicorn-Restaurant-v1.4.0.html` in a browser. Artwork/code/styles are embedded. Local-save support for raw files varies by browser; unavailable saving does not stop play. For phone use, prefer the hosted HTTPS web app rather than opening an HTML file from the Files app.

## Controls and daily flow

Drag anywhere to steer; tap a destination to walk there. Arrow keys/WASD also move. Briefly stop near a relevant object to interact. The big picture button provides a route to the next job. Cooking and cleaning have large tap alternatives to rubbing/holding. Space/E can activate the current action; normal focused buttons work with keyboard activation.

Five guests → wash returned dishes → choose/eat/drink lunch → reopen → five more guests → return all dishes → wipe tables/stations/windows → mop all floor areas → celebration/replay.

Lunch waits for the child, not a timer. Settings pause activity. Closing the app preserves supported progress; restaurant activity does not run while the page is hidden.

## Offline and device qualification

The hosted package includes a directory-scoped versioned service worker, manifest and app icons. Its first successful online load is needed to fill the offline cache. Standalone HTML contains the game assets already and does not register a worker.

Physical iPhone/Safari, Home Screen installation and a genuine installed-PWA offline relaunch were not available to test. Treat them as a device acceptance check, not a claimed pass. The full QA report distinguishes actual Chromium execution from storage/service-worker simulations.

## Launch checklist on your phone

Confirm v1.4.0 in settings. Try portrait and landscape. Make one meal and deliver it. Complete the fifth guest and dishes, finish lunch, and reopen. Close/reopen during one cleaning task and confirm progress. After a successful online launch, test your installed app without a network connection. No child name or other personal information is requested.
