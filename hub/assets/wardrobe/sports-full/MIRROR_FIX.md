# Exact skate mirror repair

The original landing failure was a raster filtering/compositing defect, not a wrong pose anchor or clothing asset. It affected 57 background-composited pixels in column x147, y191–259 (maximum channel difference 10). Transparent RGBA exposed 58 affected pixels. Drawing the base alone reproduced the defect; clothing-only layers mirrored exactly. The recorded transform matrices were symmetric, including the same float32 scale. A direct matrix moved the residual rather than curing it. Native canvas staging removed the landing seam, but staging only the base introduced other scaled-frame mismatches, so that experiment was discarded.

The final isolated `drawHop()` filters the complete right-facing actor once, preserving the six wardrobe phases and unchanged source pivot inside integer raster bounds. It reflects that finished tile at 1:1 for the other facing. Raster scale includes the caller's axis-aligned viewport/DPR transform, so the tile is not enlarged from a lower world-resolution image. A bounded 32-entry cache includes frame, cleaned outfit, pixel scale and smoothing settings. Canvas state is restored. Native-resolution drawing keeps the previous path, and no pose, clothing, manifest, timing, controller or canonical game file was changed.

The strict mirror premise was retained. The independent oracle constructs the source-relative positive raster and reverses ImageData pixel indices rather than reproducing the defective negative image-filter path. Every comparison is exact RGBA equality. A one-pixel anchor-shift negative control is rejected; no tolerance, threshold or coordinate snap was added.

Final gates:

- Original timeline: 13/13, including eight fixed-pivot/no-extra-jump oracle renders, four exact mirrored frames and timeline wrap at 540 ms.
- Expanded timeline: 183/183, zero failures/errors. This includes 84 transparent mirror pairs for all four frames, bare plus six outfits, and low/medium/high smoothing; 84 further pairs at caller scales 0.5, 1.5 and 2 with canvas-state restoration; anchor-shift and input-stability controls.
- Browser: 2,077 checks, including 644 equip/remove/restore cases, 644 native item/facing captures and 168 full outfits; zero failures/errors.
- Static: 945 checks; zero failures.
- Preservation: all 468 asset/geometry files and all 812 accepted native PNG payloads are byte-identical. The prior independent visual acceptance therefore carries forward without claiming a new independent art review.

All eight before/after world silhouette bounds are unchanged. Six preview PNGs are byte-identical. Only landing changes: 14 right-facing pixels (maximum channel difference 7) and 71 left-facing pixels (maximum 10); the final landing pair has zero differing pixels. The world PNGs and GIFs were refreshed. Historical receipts and the original failed previews are retained under `evidence/mirror-investigation/` and clearly labelled `before`.

Evidence: [hypothesis comparisons](evidence/mirror-investigation/modes.json), [final preservation and gate receipt](evidence/mirror-investigation/FIX_RESULTS.json), [current timeline](evidence/timeline/results.json), [zero-difference diagnostics](evidence/timeline/SCALED_MIRROR_DIAGNOSTICS.json), and [fresh browser/equip receipt](evidence/browser-results.json).

Canonical game integration remains outside this renderer repair. No fresh canonical gameplay, physical-phone, trigger or collision tests are claimed. Library saving remains the previously disclosed separate limitation; no further upload attempt was made.
