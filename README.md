# Unicorn Café

The current editable game lives in **game/build/**. There is one active source; GitHub Pages is built from it automatically on every push to **main**.

## Play and edit

Double-click **Play.command**, or run `python3 dev_server.py`, to play at http://localhost:8787. This preview disables offline caching.

Edit `game/build/src/game.js` for interactions, `engine.js` for recipes and day logic, `art.js` for drawing, `game/build/styles.css` for layout, and `game/build/assets/` for artwork. Portrait phone play is blocked and paused; landscape resumes it.

## Build and publish

Double-click **Build.command**, or run `python3 rebuild.py`. Output goes to `game/pages/` and is ignored by Git. The standalone HTML is generated too; neither generated output needs to be committed.

Commit source changes on **main** and push to **origin/main**. The **Build and deploy current game** GitHub Actions workflow builds, checks, and publishes `game/pages/`. A successful deployment is available at https://deanguedo-arch.github.io/unicorn-cafe/. Check the Actions run if the site has not updated. Commits on other branches do not publish the site.

Each build gives the offline worker a content-derived cache ID. Connected browsers check for a new worker, save their game, and reload when an update takes control. Offline devices receive updates when they reconnect.

## Project material

`game/art-source/` preserves artwork originals and extraction scripts. `game/ASSET-PROVENANCE.json`, `game/SOURCE-INDEX.md`, and `game/tests/` preserve source provenance and QA evidence. Existing QA reports describe earlier verification; they are not certification of later edits.

Legacy root source, duplicate builds, and release ZIPs were preserved in a verified archive outside this checkout at `/Users/deanguedo/Documents/Codex/archives/unicorn-cafe-2026-10-04/preserved-project-material.zip`. Previous committed releases also remain in Git history.
