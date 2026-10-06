# Sneaky Unicorn v9 — QA Notes

## Completed static/build validation
- Main JavaScript passes `node --check`.
- Exactly one gameplay action button exists: `blast`.
- No JUMP or SNEAK gameplay buttons remain.
- No `drawCones()` or `drawRings()` calls remain in the active draw loop.
- Four treasure maps are exposed, with 10 / 12 / 10 / 10 treasures respectively.
- New Police Unicorn Patrol has 5 opponents and no treasure objective.
- All five police patrol-route waypoints are inside the playable floor and outside declared obstacle rectangles.
- Treasure HUD uses total delivered / total treasure rather than a three-item goal.
- Police HUD uses captured / total opponents.
- Collection-level jail is temporary; police-level jail is permanent.
- Opponent patrol speed multiplier changes over time.
- Contact logic resets the unicorn without decrementing lives or deleting treasure.
- v9 service worker/cache and manifest metadata were updated.

## Important physical-device validation still needed
This environment could syntax-check and inspect the build, but browser navigation is administratively blocked here, so a true Safari/iPhone runtime pass was not possible in this run. The key physical test is: drag movement + repeated rainbow blasts + contact reset + temporary jail return + permanent Police Unicorn jail on the hosted HTTPS build.
