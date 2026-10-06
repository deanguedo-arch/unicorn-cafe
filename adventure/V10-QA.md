# Sneaky Unicorn v10 — QA Notes

## Static/build checks
- Main JavaScript parses successfully with `node --check`.
- Four playable collection levels each contain exactly two patrol people.
- All collection treasure has z=0 and is placed on valid walkable floor outside expanded obstacle rectangles.
- Five Police Unicorn opponents each specify hitsNeeded=3 and a distinct banditStyle/color.
- Sparkly reset state replaces immediate contact teleport.
- Floating in-game menu button is present and wired to pause.
- Service-worker version is 10.0.0 and removes older v1-v9 caches.

## Runtime limitation
The container browser is blocked by the environment's browser-navigation policy, so a physical iPhone/Safari playtest is still required. The most important checks are: blast aiming, whether two patrols feel fun rather than crowded, and whether ~1.08 s is the right sparkly reset duration.
