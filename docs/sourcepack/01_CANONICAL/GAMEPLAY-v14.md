# Canonical Gameplay — v14

## Controls
### Phone
- Drag anywhere on the playfield to steer in that direction.
- Movement continues in the drag direction until release.
- One large, translucent **RAINBOW BLAST** button floats over the playfield.
- No bottom control bar.
- The button has a much larger hit area than a normal UI control so young children can hit it reliably.

### Keyboard QA
Arrow keys / WASD move. Space/X may trigger Rainbow Blast in builds that preserve keyboard QA support.

## Normal treasure levels
Current regular environments are House, Market, Restaurant, and Toy Store.

### Goal
- Collect **all** treasure on the map.
- Treasure must be placed on reachable walkable floor; do not require a removed mechanic to reach it.
- Carried treasure remains visually recognizable as the same item, scaled smaller, with no inventory square around it.
- Return treasure to the home/drop-off area.

### Opponents
- Two people per normal map.
- They follow deterministic patrol routes.
- No vision cones.
- Their patrol speed varies over time to keep movement from feeling robotic.
- Rainbow Blast temporarily sends a normal-map opponent to a jail lane/area, after which they return to their patrol.
- If the unicorn physically touches an opponent, the unicorn receives a sparkly/rainbow send-back to the start rather than an instant teleport or life loss.
- Progress and collected/deposited treasure are retained.

## Magical secret doors
- Two secret doors per treasure level.
- Doors should feel hidden until the player approaches, then **materialize as magical doors** with staged glow/reveal animation.
- Level 1 must not re-trigger the same door immediately after exiting; use cooldown / exit offset / re-entry lockout.
- Each door leads to its own secret room.

## Baby unicorn rescue
- Two baby unicorns per treasure level, one per secret room.
- Babies have idle/walk/trot/follow/rescue motion states.
- On rescue, a baby joins the active follow chain.
- The line follows Mom Unicorn like ducklings following a mother duck.
- Babies are non-blocking and cannot fail navigation; they should smoothly catch up/snap back if the line gets separated.
- First baby follows Mom; second baby follows farther back.

## Rainbow portals / trap pads
- Magical pads/portals can trigger playful transport/slide moments automatically.
- They should have clear staged visual states and strong flare, but should not require another button.
- Effects are spectacle and route variation, not punishment.

## Police Unicorn mode
### Goal
Capture all bad guys.

### Enemies
Current police enemies are Halloween squishy dumpling characters:
- Pumpkin Dumpling
- Eyeball Dumpling
- Ghost Dumpling
- Candy Corn Dumpling
- Purple Monster Dumpling

Each regular dumpling:
- patrols on a route,
- uses variable speed,
- plops/squashes while moving,
- requires **3 Rainbow Blast hits**,
- then remains permanently jailed.

### Boss
King Dumpling / Halloween Boss Dumpling:
- appears after the regular dumplings are jailed,
- is visibly larger,
- has stronger plop/wobble reactions,
- requires **5 Rainbow Blast hits**,
- then is permanently jailed and completes the level.

## Menu / meta systems
- In-game menu access must always exist.
- Treasure Room records collected items.
- Costume Closet contains cosmetic unlocks.
- Secret treasures can unlock cosmetics.
- Baby rescue counts persist.

## Difficulty philosophy
Do not make a five-year-old repeat long progress because of one collision. Difficulty should come from moving characters, routing, aiming blasts, and exploration—not punitive resets.
