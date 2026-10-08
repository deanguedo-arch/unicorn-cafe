SPORTS ACTION ART V3

Changes from V2
1. Imagegen removed both embedded basketballs into transparent slots while preserving foreground gripping-hoof silhouettes. All basketball states now use the SAME separate basketball sprite, exactly 85 logical pixels in diameter. Held states draw the ball behind the character; release draws it in front. This replaces approximate baked ball sizes with deterministic sizes. The original V2 remains untouched.
2. Volleyball bump/hit balls now use 96.815 logical pixel diameter, matching the fitted set's measured 335-source-pixel ball at scale 0.289. The baked measurement has ±2 source pixel uncertainty, under 0.6 logical pixels. Contact centres were adjusted to preserve hoof contact.
3. Basketball foot baselines remeasured after image edit. All ten states remain; no new action or clothing scope.
4. Manifest now includes fixed-view hoop/net draw-order requirements.

Open contact-fit-review.png or PDF. The revised actual layer composite was rendered from unchanged source PNG masters via PDF and visually inspected. All basketballs show matching sizes and continuous hoof contact; volleyball contact sizes are consistent. HTML uses the same manifest transforms/layers but browser rendering was unavailable. It is a static asset QA page, not game implementation.

Use action-manifest.json for source rectangles, foot pivots, scale, ball centres, diameter and back/front layer. Never divide tennis sheet into equal cells. Never add a separate tennis racket: it is already physically held in the pose artwork. Basketball has NO baked balls now; always display exactly one separate ball. Volleyball SET still has a baked ball: hide the world ball in that one frame and restore it at the recorded set centre on exit. Do not use bottom-left pose in volleyball-actions.png; use volleyball-set-fitted.png.

Pixel QA records dimensions, hashes, alpha bounds, no source-rectangle edge clipping and exact comparison with V2. Imagegen did redraw some unrelated basketball pixels; no exact pixel-preservation claim is made. Other sport masters remain byte-identical to V2.

Hoop/net crossings: fixed court views only. For basketball, rear hoop/backboard -> ball -> actual foreground rim/net while inside the hoop; ball moves in front only once it clears the net. The provided ../props/basketball-front-coverage-mask.png and ../props/basketball-source-clip-contract.json implement source-matched art coverage using the unchanged original hoop texture. Volleyball: far-court actors/balls -> net -> near-court actors/balls; above-net ball remains unobscured. Depth changes are based on crossing the court plane, not screen y alone. These are honest authoring contracts, not implemented gameplay or collision claims.

Remaining limits: sharper canonical-style redraws rather than original-pixel animation; more upright anatomy; proposed timings and mirroring are not runtime tested. No new walking loops, smooth in-betweens or outfits. The ball-free basketball layer has transparent slots and is only valid with its correctly placed ball; do not display it alone in ready/aim.

Generation: built-in imagegen, transparent precise-object edit. Final prompt requested removal of both orange basketballs and their outlines into alpha-transparent slots, preservation of overlapping purple gripping hooves, no invented torso within holes, same three sprites/canvas. Two earlier narrow size-edit attempts were rejected because they did not produce equal diameters. Final source: exec-0bcb1c16-d08b-4c59-b08c-8fb97ec04f7b.png.
