# Sneaky Unicorn v15 — QA Notes

## Completed checks
- Extracted both JavaScript blocks and passed `node --check` with no syntax errors.
- Static assertions confirm the old sideways blast fallback is removed.
- Static assertions confirm regular opponents no longer decrement individual jail timers.
- Static assertions confirm group-release detection, delayed release, safe grace, and carry-capacity helpers exist.
- Static assertions confirm baby followers render their assigned carried treasure.
- Static assertions confirm v15 version/offline-cache strings are present.

## Browser-runtime limitation
A Chromium/Playwright runtime test was attempted, but this execution environment blocks browser navigation (including localhost/file URLs) with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore this release is syntax/static validated here, not claimed as a completed live-browser or physical-iPhone playthrough.

## Highest-priority iPhone checks
1. Rescue one baby, collect 2 items, verify Mom and baby each visibly carry one, then deposit both together.
2. Rescue both babies, collect 3 items, verify all three carriers and group deposit.
3. Jail only one regular opponent and wait: it must remain jailed.
4. Jail the second opponent: both remain jailed during the rainbow release beat, then both resume patrol together away from the player.
5. Move upward, stop, press Rainbow Blast: shot must still travel upward. Repeat for diagonal movement.
6. Immediately after level start, press Blast without moving: it must not default to a sideways shot.
7. Confirm Police Unicorn dumplings still remain permanently jailed and the boss flow still works.
