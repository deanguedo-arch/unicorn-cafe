# South Sports Park V3

The south approach in the existing neighbourhood opens the north park entrance. The three supplied 1536×1024 terrain sections form one 1536×3072 scrolling park; crossing either internal seam never reloads the scene or resets a round. The existing café, adventure, mall, wardrobe, puzzles and independent launches remain intact.

## Supplied art and registration

Both build ZIPs were extracted into the same temporary parent before implementation. BUILD_README, README, ART_REPAIR_STATUS, the editable brief, world geometry, seam registration, action registration, prop manifests, receding-net fit and source clip contract were read first. All 42 supplied files are retained unchanged under `assets/sports/v3/`. Both checksum lists validate 40 files; the two lists themselves account for the remaining files. No supplied image is repainted, trimmed, converted or substituted.

`shared/sports-data.js` contains exact copies of the six active source manifests as classic script data. `shared/sports.js` owns loading, the scrolling camera, collision geometry, activities and isolated sports progress. `world.js` provides the south entrance and the established picture action, drag/keyboard controls, orientation gate and backpack pause.

- Terrain origins are (0,0), (0,1024) and (0,2048). The viewport is 768×512 world units, contained within the actual browser bounds.
- Seam overlays retain their declared (0,512)/(0,1536) origins. Source alpha is multiplied by the exact local vertical opacity knots, with zero opacity outside the narrow seam band.
- Each action uses its source rectangle, source ground pivot and source-to-logical scale. The actor scale is 0.28; mirroring transforms character and ball anchor together. Basketball is 85 logical pixels, tennis 22.4, volleyball 96.815. Ball images scale uniformly by visible bounds, retaining aspect ratio.
- Basketball uses one separate ball with the declared back/front layer in each state. The rim foreground uses original hoop RGB and source alpha multiplied by the supplied grayscale mask. Foreground redraw is clipped to the ball bounds; the hoop itself is not painted twice outside that area.
- Tennis rackets are baked into the supplied poses. Physical hits use the registered contact center, including ball height, within a 48-world-unit automatic return tolerance. The opponent is smaller at the far end of the projected court.
- Volleyball's supplied set pose has an embedded ball and is retained as reference art; automatic Pong rallies use bump/contact only. The net retains the supplied uniform scale/translation; low far-side balls draw behind it, near-side and tape-clearing balls in front.
- The supplied canonical bike/skateboard sheets are byte-identical to the established riding sheets. The existing registered renderer uses those same pixels and four-frame clocks, retaining the purchased outfit.

## Play and persistence

Sports do not change wallet balance or ownership. The bike and skate areas are free-use routes for the vehicle purchased and selected in the backpack. The nearby vehicle pads open the equipment tab; they neither lend a vehicle nor start a checklist round. Old riding-checklist history remains in the isolated save, but no longer controls play.

| Place/game | Controls and goal |
| --- | --- |
| Bike and skate areas | Familiar drag/arrow movement with the selected owned vehicle. Ride through gates and over the shallow bank/roller freely. No entry cost, checklist or completion goal. |
| Basketball | Move onto the highlighted shooting spot. Hold the ball button to build power and release near the marker while the aim ring lines up. Three baskets require three different spots. Retrieve missed balls. Keyboard activation retains an assisted-power option. |
| Tennis/Pong | Press once to start the match, then drag or move left/right. Stand in the incoming ball’s path for automatic returns. First to three. |
| Volleyball | Press once to start the match, then move up/down. Returns are automatic bumps; no repeated set/hit buttons. First to three. |

Each ball game has three independently saved opponent levels: the supplied starter, Mint Pop, then Disco Comet. Winning unlocks the next level. Unlocked picture cards allow replay; locked cards are disabled and gray. Their ball-flight baselines are 1.75, 1.25 and 0.90 seconds, with within-rally variation. AI movement is 65/130/210 world units per second, reaction delays 0.45/0.25/0.12 seconds and interception tolerances 32/43/50. Edge contacts angle returns across the court, allowing skillful placement to beat faster opponents. Point pauses start the next ball automatically; only the beginning of a match requires a serve press.

The two new opponent models are complete generated sprites with baked rackets and separate bump poses, stored under `assets/sports/opponents/`. Their exact crops, ground pivots and contact points are defined in opponentFrame(); source pixels and provenance are retained. Original supplied art is unchanged. The original bump/contact poses are also used for the starter opponent so contacts align with actual racket/hands. Near-side sports clothing now uses the supplied full sports wardrobe adapter, with owned items in the original six layer phases.

Floor taps follow collision-checked routes. The middle garden has a wider passable ring, both courts have usable full painted aprons and side entrances, and the volleyball court opens directly from the central north approach. The action button recognizes each whole court apron, so approaching a tiny central station is no longer required. Nets and garden centers remain blocked. The original maps are retained; collision extents follow their visible floor and apron areas, without adding a new map join.

The top-left back picture leaves the current activity; from free walking it returns to the hub. The north floor arrow also exits when approached and stopped on, using the existing arrival-safe dwell latch. Completed rounds show a check and replay picture; lost matches also offer replay. Replay resets only the selected sports activity.

`unicorn-world-sports-v3` stores versioned activity progress and current practice mode separately from all existing native/shared saves. On interruption, successful steps persist and an unfinished rally re-serves. Storage failure reports that progress could not save and leaves the world profile untouched. Portrait, backpack, blur, cancellation and resizing suspend play or clear held input through the existing world controls.

## Missing art and known limits

These packs do **not** include fitted wardrobe layers for sports action poses, sports running loops, rear views, airborne skate tricks, activity sound effects, or a hub-to-park seam overlay. The later full sports wardrobe handoff supplies fitted layers for all ten ball-action poses. Owned equipped clothes now appear during ball practice, and while walking to retrieve the basketball. Original sprites, ball attachments and contact points remain unchanged. Existing canonical walking and outfit-compatible riding remain available. No generic clothing overlay, second racket, substitute animation, or unrelated artwork is added.

The supplied receding volleyball net has an approximately 22-pixel deviation on either side of the painted x=768 centerline. Its declared placement is retained, with a collision band that covers the actual posts. The hub connection uses its established entrance transition; continuous scrolling begins within the three-section park. Collision shapes were calibrated against the maps rather than treating proposed source geometry as already tested.

## Verification

Fresh Chromium and WebKit checks cover basketball movement, timed scores, physical pickup, release cutout removal, tennis body/contact alignment and opponent interception, automatic returns, three-point wins/losses, all three beatable difficulty levels and saved unlocks, bounded matches, collision-safe routes to every entrance, actual tap navigation around the middle garden, owned-equipment persistence, supplied checksums, exact hoop foreground coverage, seam crossings, touch controls, pause, exits and storage failure. The earlier preflight trial remains preparation material. The later full sports wardrobe handoff is installed for ball sports; its four candidate skate-hop poses remain unused by the current riding controller.

Run with an isolated source preview on port 8890:

```
node hub/tests/sports-park/assets.cjs
node hub/tests/sports-park/gameplay.cjs
node hub/tests/sports-park/visual-runtime.cjs
node hub/tests/sports-park/webkit.cjs
node hub/tests/sports-park/navigation.cjs
```

Screenshots and result files are in `tests/sports-park/evidence/`. The test runner uses fresh browser contexts and never seeds a real player's browser. Existing quick-switch, mall gameplay (18), failure/mobile (8), package integrity (4), and packaged project-path browser checks (5) also pass. Browser emulation and static art checks are not a physical-phone or child usability review.

## Full sports wardrobe handoff

The 2026-10-08 full handoff is retained in `assets/wardrobe/sports-full/`: 23 existing wearables, ten sports poses and four candidate hop poses (322 registration records). `shared/full-sports-fits.js` applies original trim offsets and phase order at the same ground pivot, source scale and facing as the native actor. The patch adds loading and per-player outfit hooks; opponents remain independent. Existing 437 walking/riding records, catalogue IDs, prices, ownership and native saves are unchanged. Hand-off SHA256 checks, mirror investigation and integration notes remain alongside the assets.

`tests/sports-park/wardrobe.cjs` exercises all 460 sports item/facing cases in Chromium and WebKit, actual equipped scenes, reload and portrait suspension. With `SPORTS_HANDOFF` pointing to the extracted original ZIP, it also compares 40 complete native outfits pixel-for-pixel against supplied proof PNGs. The golden captures include held basketballs, rackets, sleeves, protected expressions and multi-slot combinations. Physical-phone and child review remain pending.

## Easier navigation — 2026-10-09

Walking now follows generous paved polygons across the riding track, skating space, court aprons and court-end paths. The north planted island uses a bean-shaped footprint rather than an oversized oval. The middle garden blocks its planted core; hoop and net blockers follow narrow ground footprints. Both terrain joins overlap so an exact y=1024 or y=2048 coordinate cannot become an invisible one-pixel wall. Artwork, sports movement constraints, ball physics, wardrobe and saved progress remain unchanged.

The navigation browser check covers 19 additional painted-floor destinations, both exact terrain joins and planted-core/equipment blockers, alongside actual floor-tap travel and landscape controls. Screenshots and receipts for this update are in `tests/sports-park/evidence/easier-navigation/`. Unrelated untracked files in the checkout were preserved.
