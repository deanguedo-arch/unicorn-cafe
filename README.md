# Sneaky Unicorn: Rainbow Restaurant
## Complete restaurant release · v1.1.0 · 2026-10-03

This is the restaurant game, not a cooking-screen-only demo. Guests walk through the magical front door, wait at three picture-labelled tables, request a dish and a particular ingredient/flavour, and receive meals you make and physically carry to them.

### Put this ZIP on GitHub Pages

1. Extract the **GitHub-Pages.zip**. Upload its **contents**, not the ZIP itself, to a separate GitHub repository. `index.html`, `styles.css`, `src`, `assets`, `icons`, `manifest.webmanifest`, and `sw.js` must sit at the repository root. Keep their names and folder structure unchanged. Include `.nojekyll`.
2. Commit the files to `main`. In the repository, open **Settings → Pages → Build and deployment → Source → Deploy from a branch**. Choose **main** and **/(root)**, then **Save**.
3. Open the site address displayed by GitHub Pages after publishing finishes. Use the site address, not the repository's source-file page. There is no npm install, build command, server API, or secret key.

No site has been published for you. Nothing in your adventure builds or project settings has been changed. Use a separate repository so this is a separate game. GitHub Pages publication makes the hosted site publicly reachable; don't add private files or personal information to the site.

### Put it on an iPhone

Open the published HTTPS site in **Safari**. From Share (or Page Menu → Share), choose **Add to Home Screen**, turn on **Open as Web App** when shown, and tap **Add**. Launch that icon once while online. The game menu says **Ready to play offline** after its service worker finishes caching.

Try a full close/reopen in Airplane Mode on your own phone before relying on offline play. The package includes offline support, but an actual iPhone/Home Screen/offline installation was not available for testing here. Do not use the ZIP preview in Files as the installation method.

### Play

**Welcome → picture order → kitchen → make it → carry → matching table.**

- Drag anywhere on the restaurant floor to walk. A tap on a guest's picture bubble, a table, or a table card walks the unicorn there along a visible route. The large bottom-right action button also walks to the next useful place.
- Say hello to a guest to accept their picture order. Go to the kitchen; the matching recipe is highlighted, but all seven recipes remain available. The ticket stays visible while cooking.
- Tap the large tool button to prepare food. Rubbing/stirring the worktop also works; pouring and cooking can use a hold. Each step changes the food. Ingredient choices use large picture buttons. Match both the dish **and** its requested variation.
- Press **Carry to the table** after the meal is complete. The unicorn visibly carries it. Visit the matching heart, star, or flower table to serve. A wrong table keeps your meal; a mismatched dish or ingredient lets you remake it without a penalty.

Desktop: use mouse/touchpad, or **WASD / arrow keys** to walk; **E / Space** performs the current action. Tab and Enter/Space operate buttons. Escape backs out or pauses. The sound button mutes; the pause menu includes gentler motion.

### All seven dishes, all in this release

| Dish | Custom requests | Preparation |
| --- | --- | --- |
| Pizza | Tomato or mushroom | Squish dough, sauce, cheese, topping, bake |
| Coffee | Milky or cocoa | Grind beans, pour water, choose flavour, stir |
| Cupcakes | Strawberry or chocolate frosting | Flour, egg, mix, bake, frosting, sprinkles |
| Ice cream | Strawberry or vanilla | Cone, flavour, scoops, sprinkles |
| Hamburger | Cheese or tomato | Bun, patty, filling, lettuce, bun lid |
| Soup | Carrot or pea | Water, vegetables, toy chopper, stir, warm |
| Chicken & sweet potatoes | Extra peas or corn | Chicken, sweet potatoes, glaze, vegetables, roast |

Guests wait patiently. There is no countdown, burning food, health loss, money penalty, jail, sneaking, or combat. One active worktop and one carried tray keep the first version manageable. More tables fill gradually; serving seven guests completes a day. **Open again** starts another day with different order combinations while retaining your recipe collection and lifetime meal count.

### Saves and privacy

Progress is saved on this browser/device under `sneaky-unicorn-restaurant-v1`, including guests, accepted orders, partial preparation, carried food, recipe collection, and settings. The key is separate from the adventure game. The adult reset has a confirmation step and clears only this restaurant's game state.

Saving is best-effort: a browser can refuse or clear local storage. The game remains playable and reports when saving is unavailable. Moving to a different browser, site origin, or installation context is not a save-transfer system. There is no account or cloud backup. Avoid clearing site data to preserve progress.

The game has no ads, payments, chat, analytics, accounts, personal-data fields, or external runtime libraries. The standalone release makes no HTTP(S) requests; the hosted version requests its own same-origin assets and offline worker. Your chosen hosting provider may keep ordinary hosting access logs independently of this game.

### Files

- `index.html`, `styles.css`, `src/`: complete editable game runtime.
- `assets/`: 57 optimized sourcepack images, including the real unicorn, guests and restaurant map.
- `icons/`, `manifest.webmanifest`, `sw.js`: iPhone/web-app packaging with a versioned, project-scope-specific cache.
- `ASSET-PROVENANCE.json`: precise asset origins; new food-state art is editable Canvas/SVG code in `src/art.js`.
- `QA-REPORT.md`, `VERSION.json`, `SHA256SUMS.txt`: verification record and checksums.

The separate **Standalone.html** release embeds all graphics and code for a one-file desktop browser copy. Open it with a browser, not a text editor. The separate **Editable-Source.zip** adds original source images used in this game, reference documents, rebuild scripts, test programs/results and selected screenshots. It is not the ZIP to upload directly to Pages.

### Future edits and offline updates

Edit `src/engine.js` for recipes, orders, save validation and routes; `src/game.js` for the restaurant/UI/input; `src/art.js` for preparation artwork; `styles.css` for layout. When publishing a changed release, update both the runtime version and the cache version in `sw.js`. Update its file list when adding an asset. Rebuild the standalone file and regenerate checksums. Keep the save key stable unless a deliberate migration is implemented.

### Official publishing references

GitHub Docs — “Configuring a publishing source for your GitHub Pages site” and “Creating a GitHub Pages site.” Apple Support — “Turn a website into an app in Safari on iPhone.” Instructions checked on 2026-10-03. Menu wording can differ between OS/account configurations.
