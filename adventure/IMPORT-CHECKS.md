# Local import checks — 2026-10-05

- Both downloads match Library byte sizes; both ZIP CRC checks pass.
- Source and web-app index.html are byte-identical: SHA256 d3dcf4d3d99eb3a111069acddbb1d9b571d305a5644f6ea6d56423df85f96d9f.
- All imported original file hashes match IMPORT-MANIFEST.json.
- Both inline JavaScript blocks pass node --check. All 82 embedded image data payloads decode. The original initialization awaits every embedded image before showing the menu; reaching the menu confirms their browser loading succeeded.
- Chrome at http://127.0.0.1:8788/: v15 menu displays all five map choices; Big Cozy House enters gameplay with unicorn, map, treasures and Rainbow Blast. Offline copy reports ready. No warning/error logs observed.
- Chrome at http://127.0.0.1:8787/: existing café designer renders artwork and enters restaurant gameplay with the arriving-customer action. All 11 then-visible DOM images loaded. No warning/error logs observed.
- All 308 pre-existing tracked repository files have the same SHA256 before and after import. HEAD remains 32509cf6d4e32e2b770bcd79b74c745ef5e3a572. git diff is empty; additions are limited to adventure/, PROJECT-RULES.md and UNICORN-WORLD-VISION.md.

These are bounded independent-launch and asset smoke checks, not a complete game playthrough, map audit, offline relaunch test or physical iPhone test. No adventure mechanic or art changes were made. Author QA reports remain unchanged and describe their original limitations.

Latest-source qualification: v15 is the newest complete Midnight Mischief export exposed by the Library searches on this date; it is newer than the AI Source Pack v1. Unexported original-author conversation state was not independently certified. The local import is usable; any later export can be reconciled by provenance and hashes without overwriting café work.
