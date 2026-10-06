# Local fitted-clothing review

Open `http://localhost:8790/hub/trials/fit-v1/` while the repository preview server is running.

The left actor uses the previous `UWArt.unicorn` renderer, preserved in `legacy-art.js` and the original sources included in the supplied archive. The right actor uses the imported full-canvas layers, in manifest order and around its registered foot pivot. Both support the same independent bow, shirt and necklace toggles, movement, facing and scale. Portrait suspends the preview; landscape resumes it.

`renderer.js` is a reusable sampled-pose adapter. It draws base → shirt → bike foreground when wearing the shirt → necklace → bow, and transforms the whole group together. It does not stretch a cropped garment, add old sleeve patches, or apply the old generic face mask. Unknown poses fail explicitly.

All 64 supplied files remain unmodified; the 63 entries in the supplied checksum list were verified. `IMPORT.json` records the archive fingerprint. Original generation sources, metadata, prompts and previews remain alongside the imported layers.

This is a local comparison, separate from the normal game entry. Native gameplay, world ownership, saves, item identifiers, prices and the published wardrobe are untouched. The pack supplies only five sampled poses and three wearables; fourteen other poses, all complete walking/riding cycles and the other clothing are still absent. Do not claim the whole wardrobe is fixed based on this trial.

The previous broad face-preservation tests confirmed that the old renderer did not repaint the face. They did not establish that garments fit the anatomy or look natural. This review compares actual garment registration and occlusion instead.

Verification: `node hub/tests/fit-trial/browser.cjs` passed five comparisons against the supplied composites (maximum two channel levels from browser alpha rounding), 80 pose/facing/item combinations, drag/movement, portrait suspension, 852×393 and 568×320 layouts, no save writes, no missing images and no browser exceptions. Results and screenshots are in `hub/tests/fit-trial/evidence/`. These are isolated browser checks, not physical-device or full-animation acceptance.
