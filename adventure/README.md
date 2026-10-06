# Sneaky Unicorn adventure — local import

Working home: the unicorn-cafe repository. This is the imported Midnight Mischief v15 game, independently of the café in game/build. Its current interface uses picture places, restaurant-style settings, wordless gameplay feedback and a landscape-phone gate. Original imported packages and artwork remain preserved; IMPORT-MANIFEST.json records the import baseline, not hashes of the subsequent UI edits.

From the repository root, run:

    python3 -m http.server 8788 --bind 127.0.0.1 --directory adventure

Then open http://127.0.0.1:8788/. The café keeps its existing Play.command / python3 dev_server.py entry at http://localhost:8787. Use separate ports to isolate saves and workers. Stop either preview with Control-C. No publishing is needed.

Edit adventure/index.html for its existing inline styles, scripts, maps and embedded DATA artwork. generated-art/ preserves the six original generated art images; original-packages/ preserves both exact downloads. Runtime artwork is embedded in index.html, so editing a PNG alone does not update embedded pixels. This import intentionally does not extract/rebuild/redraw them.

The source ZIP omitted launch companions. Matching web-app v15 supplied sw.js, manifest.webmanifest, icons/, _headers and historical notes. Both ZIPs have byte-identical index.html. These are original files; no gameplay or cache code was rewritten. There is no build step or external runtime library.

V15-CANON-RULES.md and V15-CHANGES.md govern current mechanics. README.txt starts with inherited v12 text; use the v15 notes for current carrying and jail behavior. Author QA notes are historical and explicitly lacked runtime verification. See IMPORT-CHECKS.md for this import's actual checks.

IMPORT-MANIFEST.json records selection evidence, Library source IDs, package CRC/size/SHA256, imported file hashes and all pre-import café tracked-file hashes. Original Library files and Downloads remain intact.

Future shared-world work is described in ../UNICORN-WORLD-VISION.md and ../PROJECT-RULES.md. Current adventure controls/mechanics remain unchanged.

## Picture-first interface

The child-facing place, play, pause, celebration, help and retry screens use pictures. Place tiles fill the available menu area: five in one row on short landscape screens and a three-and-two arrangement on larger screens. Each has a large theme picture for home, groceries, food, toys or police patrol, using existing game artwork and matching illustrated UI symbols. Written accessible names remain, and parent settings contain brief captions and offline/version status. The settings gear stays available and suspends the current activity without changing its native mode. Portrait phones up to 900px wide show a rotate-phone picture and suspend input, simulation and audio; landscape restores the previous screen. This gate remains effective when the browser cannot lock orientation.

The existing v15 save key/schema, maps, carrying/jail/aim rules and reload behavior remain authoritative. No mid-run reload saving has been added. The scope-specific worker version is `15.0.0-pictures-3`; no source artwork or original package was regenerated.

Run `node adventure/tests/picture-first.cjs` from the repository root with Playwright on NODE_PATH (or PLAYWRIGHT_MODULE pointing to its module), CHROMIUM_PATH pointing to an installed test browser, and the local preview running. UNICORN_QA_URL defaults to http://127.0.0.1:8790; UNICORN_QA_OUTPUT defaults to /tmp/unicorn-picture-first-qa. These tests create isolated browser contexts, never use a player's profile, and include phone-size, save, canonical-mechanic, hub and offline checks. See tests/picture-first/QA-RESULTS.json for this implementation's browser evidence. Physical-phone and child usability testing remain separate acceptance checks.
