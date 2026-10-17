# Bedroom play — 2026-10-17

User-approved additions: play with toys, bounce on the bed, sleep and wake, matching artwork, and a clear separation from arranging the room.

- Tap the bed or placed teddy/train/plant directly, or use the bedroom play entrance.
- Picture controls: bed bounce, sleep/wake, teddy cuddle, toy train, watering plant, decorate, sound.
- Sleep has a new tucked-in sprite and breathing motion. Train uses a new wooden track. Watering can and wake-up sun are new matching assets. Bounce/cuddle use existing fitted happy poses to retain clothes.
- Transient play never changes coins, ownership, outfit selection or saved decoration placements. Close/reload returns to normal room play. Sleep has no penalty or timer.
- Artwork source, prompt and crop coordinates: `hub/assets/playbook/BEDROOM-PROVENANCE.json` and `BEDROOM-PROMPT.txt`. Generated with built-in image_gen, using original bedroom and canonical unicorn as references. Original assets retained.

## Evidence

- `hub/tests/mall/bedroom-play.cjs`: Chromium and WebKit at 568×320, actual touch controls; activity switching, portrait pause AND resumed advancing clock, settings refresh, sound controls, close/reload, asset failure/retry, unchanged shared profile during play.
- `hub/tests/mall/free-decoration.cjs`: both engines; whole-room positioning, overlap, grab offsets, edge clamp, save failure and reload.
- `hub/tests/mall/playbook-state.cjs`: 39 state checks.
- `hub/tests/mall/playbook-ui.cjs`: full adventure/decor/scrapbook/picnic and native game-launch regression.
- Independent review found rotation killing the activity loop, settings remounting play, and failed-image robustness issues. Fixed and rechecked in both engines.

## Assessment and remaining limits

Picture clarity: improved through direct targets and pictures of the actual toys/bed. Child comprehension remains unverified.
Visual usefulness: new props match inspected room artwork; train path and watering placement checked in actual browser screenshots.
Learner effort: fewer entry steps via direct bed/toy taps; no reading, payment or timed success requirement.
Functionality: added five activities; preserved shared possessions and native game launches in regression checks.

Physical-phone and child review remain separate from desktop browser emulation. Other rooms and outdoor environmental interactions are not part of this release.

Prevention: keep pause/resume tests asserting both preserved activity state and an advancing animation clock after returning to landscape; a frozen clock during portrait alone missed the initial regression.
