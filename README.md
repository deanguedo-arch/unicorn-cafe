# Unicorn Café — local v2.0.0 project

This is a local branch of https://github.com/deanguedo-arch/unicorn-cafe. The finished v2.0.0 game is installed locally; nothing has been pushed or published.

## Play and edit

Double-click **Play.command** on this Mac, or run `python3 dev_server.py` in this folder. It opens http://localhost:8787. Keep the Terminal window open; press Control-C to stop. Refresh the browser after edits. This development preview disables offline caching so changes appear immediately.

Edit **game/build/src/game.js** for controls and activities, **engine.js** for recipes/day logic, **art.js** for drawing, **game/build/styles.css** for layout, and **game/build/assets/** for artwork. Open this folder as a project in Codex or your editor.

Double-click **Build.command**, or run `python3 rebuild.py`, to regenerate the standalone HTML and root GitHub Pages build. Python 3 is the only build dependency. The root index.html is the ready-to-publish release; the local preview runs editable modular source.

## Git

Work is on branch `codex/local-v2-game`; `origin` is your existing GitHub repository. Previous online code remains in Git history. Older source folders at the repository root are retained for reference; **game/** is the current editable source. Commit changes locally, review them, then push this branch when you want to share it. No online changes have been made by this setup.

See game/QA-REPORT.md and game/ACCEPTANCE-MAP.md for release evidence.
