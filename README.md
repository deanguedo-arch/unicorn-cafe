# Unicorn World

The main game is **Unicorn World**, connecting the café, adventure, mall, wardrobe, vehicles and arcade. GitHub Pages builds the connected game automatically on every push to **main** and opens it at [the existing game link](https://deanguedo-arch.github.io/unicorn-cafe/).

## Play and edit

Double-click **Play-World.command**, or run `python3 hub_preview.py`, and open [the local world](http://localhost:8790/hub/?legacy=1). The local legacy preview retains the established native café/adventure save origins. See [hub/README.md](hub/README.md) for phone preview and save details.

Edit `hub/` for shared world, shopping and arcade behavior. The original café remains editable and independently launchable in `game/build/`; adventure remains in `adventure/`. Their native save keys and mechanics stay intact. Portrait phone play pauses and clears held controls; landscape restores it. The contextual action button stays at the lower right.

For the independent café preview, use **Play.command** or `python3 dev_server.py` at http://localhost:8787. This preview disables offline caching. Edit its interactions in `game/build/src/game.js`, recipes/day logic in `engine.js`, drawing in `art.js`, layout in `game/build/styles.css` and artwork in `game/build/assets/`. [The mall QA report](hub/MALL-QA-REPORT.md) records current checks and the pending physical-device/child review.

## Build and publish

Double-click **Build.command**, or run `python3 rebuild.py`. `build_world.py` packages the connected game in the established ignored `game/pages/` delivery folder. The original café builder produces its independent offline export in ignored `game/cafe-pages/` and retains its standalone HTML export. Generated delivery folders are not committed; editable sources are.

Commit source changes on **main** and push to **origin/main**. The unchanged **Build and deploy current game** GitHub Actions workflow builds and publishes `game/pages/`. The rebuild command checks world packaging, and the workflow retains its café logic/offline checks. The main URL launches `hub/`; the café and adventure remain available under `game/build/` and `adventure/`. Commits on other branches do not publish the site.

The replacement root worker retires only the old café cache at this project's root. It leaves native localStorage, the world profile and sibling caches alone. Existing same-origin café progress and coins are retained, with the old coin balance imported to the world wallet once. Both game bridges use the checked project base URL, so they work beneath GitHub's `/unicorn-cafe/` path. Native game workers keep their own scopes; the café reloads only for an update to its own worker. The connected world currently needs a network connection; full shared-world offline support and automatic device sync remain later work.

## Project material

`game/art-source/` preserves artwork originals and extraction scripts. `game/ASSET-PROVENANCE.json`, `game/SOURCE-INDEX.md`, and `game/tests/` preserve source provenance and QA evidence. Existing QA reports describe earlier verification; they are not certification of later edits.

Legacy root source, duplicate builds, and release ZIPs were preserved in a verified archive outside this checkout at `/Users/deanguedo/Documents/Codex/archives/unicorn-cafe-2026-10-04/preserved-project-material.zip`. Previous committed releases also remain in Git history.
