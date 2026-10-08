# South Sports Park V3

The south approach in the existing neighbourhood opens the north park entrance. The three supplied 1536×1024 terrain sections form one 1536×3072 scrolling park; crossing either internal seam never reloads the scene or resets a round. The existing café, adventure, mall, wardrobe, puzzles and independent launches remain intact.

## Supplied art and registration

Both build ZIPs were extracted into the same temporary parent before implementation. BUILD_README, README, ART_REPAIR_STATUS, the editable brief, world geometry, seam registration, action registration, prop manifests, receding-net fit and source clip contract were read first. All 42 supplied files are retained unchanged under `assets/sports/v3/`. Both checksum lists validate 40 files; the two lists themselves account for the remaining files. No supplied image is repainted, trimmed, converted or substituted.

`shared/sports-data.js` contains exact copies of the six active source manifests as classic script data. `shared/sports.js` owns loading, the scrolling camera, collision geometry, activities and isolated sports progress. `world.js` provides the south entrance and the established picture action, drag/keyboard controls, orientation gate and backpack pause.

- Terrain origins are (0,0), (0,1024) and (0,2048). The viewport is 768×512 world units, contained within the actual browser bounds.
- Seam overlays retain their declared (0,512)/(0,1536) origins. Source alpha is multiplied by the exact local vertical opacity knots, with zero opacity outside the narrow seam band.
- Each action uses its source rectangle, source ground pivot and source-to-logical scale. The actor scale is 0.28; mirroring transforms character and ball anchor together. Basketball is 85 logical pixels, tennis 22.4, volleyball 96.815. Ball images scale uniformly by visible bounds, retaining aspect ratio.
- Basketball uses one separate ball with the declared back/front layer in each state. The rim foreground uses original hoop RGB and source alpha multiplied by the supplied grayscale mask. Foreground redraw is clipped to the ball bounds; the hoop itself is not painted twice outside that area.
- Tennis rackets are baked into the supplied poses. Physical hits use the registered contact center, including ball height, within a 48-world-unit catch tolerance. The opponent is smaller at the far end of the projected court.
- Volleyball's set pose has an embedded ball. The external ball is hidden for that frame and restored at its registered exit position and size. The net retains the supplied uniform scale/translation; low far-side balls draw behind it, near-side and tape-clearing balls in front.
- The supplied canonical bike/skateboard sheets are byte-identical to the established riding sheets. The existing registered renderer uses those same pixels and four-frame clocks, retaining the purchased outfit.

## Play and persistence

Sports do not change wallet balance or ownership. The bike and skate areas are free-use routes for the vehicle purchased and selected in the backpack. The nearby vehicle pads open the equipment tab; they neither lend a vehicle nor start a checklist round. Old riding-checklist history remains in the isolated save, but no longer controls play.

| Place/game | Controls and goal |
| --- | --- |
| Bike and skate areas | Familiar drag/arrow movement with the selected owned vehicle. Ride through gates and over the shallow bank/roller freely. No entry cost, checklist or completion goal. |
| Basketball | Walk around the court with familiar controls. Press the ball picture when the moving aim ring crosses the hoop; closer shots have a smaller timing swing. Make three baskets. A missed ball stays on the floor and must be collected. The release pose ends when the ball leaves, so its cutout never remains on the unicorn. |
| Tennis/Pong | Drag the unicorn along the near baseline or use left/right movement. Stand on the landing circle and press the racket picture to return. A moving far-side opponent tries to intercept; a missed ball awards the other side a point. First to five. |
| Volleyball | Move up/down to the landing circle, then press the changing bump, set and hit pictures. A moving opponent rallies across the net; misses award opponent points. First to three. The embedded set ball remains the only visible ball until the hit handoff. |

The sports-ready poses move across the courts with a small step bob, preserving their baked rackets and supplied anatomy. Dedicated sports running loops are absent. Ball games use plain sports characters until fitted sports layers are supplied. Completed or lost matches offer a replay picture. Both sides' scores persist; interruption restarts the current rally without erasing points.

Floor taps now use collision-checked routes around scenery in the hub, shops and park. Each segment is sampled against the existing collision map. Park activity destinations use the actual station location rather than an indoor doorway offset that could point outside the skate path. Drag and keyboard movement retain collision checks and familiar controls.

The top-left back picture leaves the current activity; from free walking it returns to the hub. The north floor arrow also exits when approached and stopped on, using the existing arrival-safe dwell latch. Completed rounds show a check and replay picture; lost matches also offer replay. Replay resets only the selected sports activity.

`unicorn-world-sports-v3` stores versioned activity progress and current practice mode separately from all existing native/shared saves. On interruption, successful steps persist and an unfinished rally re-serves. Storage failure reports that progress could not save and leaves the world profile untouched. Portrait, backpack, blur, cancellation and resizing suspend play or clear held input through the existing world controls.

## Missing art and known limits

These packs do **not** include fitted wardrobe layers for sports action poses, sports running loops, rear views, airborne skate tricks, activity sound effects, or a hub-to-park seam overlay. The supplied plain sports unicorn is used during ball practice; equipped clothes remain owned and return when practice ends. Existing canonical walking and outfit-compatible riding remain available. No generic clothing overlay, second racket, substitute animation, or unrelated artwork is added.

The supplied receding volleyball net has an approximately 22-pixel deviation on either side of the painted x=768 centerline. Its declared placement is retained, with a collision band that covers the actual posts. The hub connection uses its established entrance transition; continuous scrolling begins within the three-section park. Collision shapes were calibrated against the maps rather than treating proposed source geometry as already tested.

## Verification

Fresh Chromium and WebKit checks cover basketball movement, timed scores, physical pickup, release cutout removal, tennis body/contact alignment and opponent interception, volleyball movement/misses and embedded-ball handoff, bounded matches, collision-safe routes to every entrance, actual tap navigation around the middle garden, owned-equipment persistence, supplied checksums, exact hoop foreground coverage, seam crossings, touch controls, pause, exits and storage failure. The corrected artwork trial remains preparation material; it is not imported as clothing or an airborne skate animation.

Run with an isolated source preview on port 8890:

```
node hub/tests/sports-park/assets.cjs
node hub/tests/sports-park/gameplay.cjs
node hub/tests/sports-park/visual-runtime.cjs
node hub/tests/sports-park/webkit.cjs
node hub/tests/sports-park/navigation.cjs
```

Screenshots and result files are in `tests/sports-park/evidence/`. The test runner uses fresh browser contexts and never seeds a real player's browser. Existing quick-switch, mall gameplay (18), failure/mobile (8), package integrity (4), and packaged project-path browser checks (5) also pass. Browser emulation and static art checks are not a physical-phone or child usability review.
