SNEAKY UNICORN: RAINBOW KITCHEN
First complete playable version — 1.0.0

OPEN ON A COMPUTER
1. Download Sneaky-Unicorn-Rainbow-Kitchen-v1.0.0.html.
2. Open the downloaded file in a normal web browser. Use the actual downloaded
   file; a document/file preview may not run the game.
3. Press the big play button. Choose the food picture the customer wants.
4. Tap the food, use broad finger/mouse movements, or tap the large tool button.
   Every cooking gesture has a tap alternative. Keyboard: Tab to a control,
   Enter/Space to activate; Enter/Space also cooks when the worktop is focused.
5. Serve the finished dish. Another customer order follows. All seven recipes
   are available immediately from the picture menu.

The standalone HTML embeds every asset and all code. It needs no connection
after download. No installation or external code libraries are required.

IPHONE / IPAD WEB APP
The iPhone ZIP contains index.html, JavaScript/CSS, all assets, a manifest,
192/512px icons, an Apple touch icon and a versioned offline service worker.

1. Unzip Sneaky-Unicorn-Rainbow-Kitchen-iPhone-v1.0.0.zip.
2. Put the complete contents on a static HTTPS host of your choice, preserving
   the folder structure. This build has NOT been published or deployed.
3. Open that HTTPS address in Safari, then use Share > Add to Home Screen.
4. Open the game while online. After the kitchen loads and caching completes,
   the small footer says "Saved here · offline ready". Wait for that before
   trying an offline launch. Fully close/reopen the installed app once online.
5. Then test reopening without a connection. Both portrait and landscape are
   supported by the layout. Raw HTML inside the iPhone Files preview is not
   the intended iPhone launch route.

If Add to Home Screen is unavailable, check that the page is open in Safari
at the HTTPS game address. No account, permission to use a camera/microphone,
or personal information is needed by the game.

THE WHOLE MENU
Pizza: roll dough, spread sauce, sprinkle cheese, add tomatoes, bake.
Coffee: add beans, brew into the cup, pour milk, stir.
Cupcakes: mix batter, fill three cases, bake, pipe frosting, add sprinkles.
Ice cream: cone, strawberry scoop, vanilla scoop, purple scoop, berry drizzle.
Hamburger: sizzle, flip, stack patty/cheese, add tomato/lettuce, cap with bun.
Soup: vegetables, broth, stir, simmer, ladle into a bowl.
Chicken with sweet potatoes: chicken on tray, sweet-potato wedges, glaze,
  roast, plate together.

KIND, SIMPLE PLAY
- One picture order at a time. Customers wait patiently. No countdowns,
  burning, money, lives, punishment or reading-dependent puzzles.
- The menu book opens all seven recipes. Choosing a new recipe starts a fresh
  tray; earned stickers remain. The small circular arrow restarts that recipe.
- The big button and the whole worktop both accept cooking input. Broad drags
  count; there is no precision tracing. A pictured hand offers a visual hint.
- A wrong dish becomes a happy baby snack. The requested food picture returns,
  and the big pictured retry button starts the requested recipe. Wrong serves
  do not advance the customer order or award an incorrect sticker.
- Correct dishes earn recipe stickers. Make all seven for a rainbow-chef
  celebration, then keep playing. Replay does not erase collected stickers.
- Home pauses your place. "Keep cooking!" resumes the current dish or result.
- Sound starts after a player interaction. The speaker button mutes/unmutes.
  Sounds are synthesized locally. Vibration is optional where supported.

LOCAL PROGRESS
The game saves current recipe/step, order queue, correct serves, recipe
stickers and sound preference on the current device/browser. It stores no
child name or other personal information. No ads, purchases, analytics,
accounts, chat, external fonts or third-party runtime requests exist.

Progress belongs to the browser and game address used. Moving the standalone
file, changing the hosted address, private browsing, clearing website data or
the browser deleting storage can change/remove access to that local save.
If saving is unavailable, cooking still works and the footer says so.

The save key is sneaky-unicorn-rainbow-kitchen:v1. Existing adventure builds
and their saved data are not modified. The service worker removes only old
caches whose names begin with rainbow-kitchen-v.

EDITABLE SOURCE
Unzip Sneaky-Unicorn-Rainbow-Kitchen-Editable-Source-v1.0.0.zip.
src/index.html  — page structure and accessible controls
src/style.css   — portrait/landscape layouts, touch sizes, motion
src/app.js      — orders, cooking input, UI, saves, audio and replay
src/recipes.js  — all seven recipes and their steps
src/kitchen.js  — Canvas food preparation and effects
src/assets.js   — generated image-path map
assets/         — optimized, separate game assets and food provenance
art-originals/  — original source imagery, generated atlases, exact prompts
docs/           — source decisions and relevant canonical reference documents
tests/          — reproducible checks and machine-readable actual results
build.py        — builds standalone HTML, web app, ZIPs and SHA256 manifests

To rebuild (Python 3 + Pillow):
  python3 -m pip install Pillow
  python3 build.py --package

Output: webapp/ and ../deliverables/. To serve locally on your own computer:
  python3 -m http.server 8080 --directory webapp
Then open http://localhost:8080 in your browser. Localhost is suitable for
development; iPhone installation normally uses an HTTPS host.

Optional test dependencies are jsdom and @napi-rs/canvas. They are used only
by the development tests, never by the delivered game:
  npm install --no-save jsdom@26 @napi-rs/canvas
  node tests/controller-tests.cjs
  node tests/canvas-tests.cjs
  node tests/integration-tests.cjs
  node tests/package-tests.cjs --sourcepack=/path/to/Sneaky-Unicorn-AI-Source-Pack-v1.zip

The package test verifies the unchanged original input ZIP as well as the
new build. The original 82 MB source pack is not duplicated in this smaller
editable-source download. Supply its path with --sourcepack as shown.

TESTING LIMITS — PLEASE READ
The local DOM/controller, native Canvas, asset and package tests are described
in TEST-REPORT.txt. These do not establish real Safari behaviour. No physical
iPhone/iPad testing, audible audio check, live browser layout check, or real
browser offline installation test was completed in the build environment.
There was no installed local browser; its browser download failed. Automatic
approval review also rejected opening the local preview in the cloud browser.
That rejection was respected; no browser workaround was attempted.

Before giving her an installed iPhone build, the remaining practical check is:
open it on that phone, complete a dish in each orientation, check sound/mute,
return after closing the app, and confirm an offline relaunch. The provided
source and test reports make any concrete follow-up fixes reproducible.

VERSION / INTEGRITY
VERSION-MANIFEST.json and SHA256SUMS.txt in the web-app ZIP list each runtime
file. The separate release SHA256 manifest lists the downloadable game and
ZIP checksums. All native downloadable attachments are below 20,000,000 bytes.
