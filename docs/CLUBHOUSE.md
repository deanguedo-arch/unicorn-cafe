# Rainbow Clubhouse · v1.0.0 candidate

This expansion is based on Unicorn World commit `f39844b04e3c2d4caa262beb0bd7ce1532438ac3`. It does not publish itself, change accounts, or add purchases. The original room and character artwork is retained.

## Play

Walk to the downstairs room in the house. Four physical play areas share the existing movement and picture action button:

- **Picture table:** tap heart, flower or rainbow stamps, paint with the brush, and choose a paint pot. Undo the latest mark or finish a picture to carry it to the café. The paper stack reopens saved pictures without overwriting them.
- **Cushion fort:** tap two cushions or drag one onto another to rearrange the fort, then play peekaboo. Every arrangement works.
- **Ball run:** swap the three ramps and press the play picture. Each arrangement leads to the basket; there is no score or timer to beat.
- **Puppet theatre:** pick a familiar pink or blue unicorn puppet, then wave, dance or peek. No reading or remembered sequence is required.

A carried drawing can be hung in the small café wall frame between the left lamp and kitchen. Previous drawings remain in the paper stack. The drawing never replaces or blocks a meal or dirty tray. Pink and blue guests can admire the picture; friends met during puppet play have an extra greeting.

The café also gives a single short picture demonstration after a pause on a task. It never completes the task for the player. New restaurant saves keep one guest through the first serve, clear and wash cycle before gradually increasing activity. Older saves retain their established pacing.

## Save compatibility

- Existing world database name/version and `state`, `receipts`, `media` stores remain unchanged.
- Existing café key and schema remain unchanged. Its new first-service marker is optional and is not retroactively added to older saves.
- Artwork is local to the browser profile. There is no cloud sync or external upload.
- Draft metadata, finished artwork references and play arrangements live in a new `clubhouse` namespace. Drawing content uses namespaced entries in the existing media store.
- Save actions and receipts commit together. Repeating an acknowledged action does not create another drawing or spend money.
- Stale draft revisions are rejected. The picture table offers keeping unsaved conflicting marks as a separate picture instead of replacing the other window's draft.
- An interrupted or failed save does not erase the visible picture. A per-tab recovery copy is attempted; storage warnings remain visible if saving cannot be completed.
- Saved artwork is never automatically pruned. Drawing/payload limits fail safely rather than deleting earlier work.

## Input and accessibility

New controls have at least 48 CSS-pixel targets. Tap alternatives supplement dragging, and keyboard controls remain available. The picture canvas uses arrow keys to position the next mark and Space/Enter to add it. Cushion/ramp buttons also support arrow-key rearrangement. Escape and the back picture return to the room.

Landscape remains the phone play orientation. Portrait, backgrounding and interruption pause animations and release held gestures. Sound and reduced-motion preferences are respected.

## Technical boundaries

The connected café uses only the selected carried/displayed drawing projection, not the private draft or full artwork collection. Only the verified café frame may request the fixed café display action. The independent café continues without the shared module; the adventure, existing art, wallet rules, clothing, food recipes, lunch and cleanup goals remain intact.

The world packager includes the new shared modules and stylesheet. Whole-world offline support has not been added. The independent café's existing offline worker scope is retained.

## Verification

See the accompanying handoff verification report for exact executed checks and release hashes. Automated checks use synthetic saves, not the player's browser data. Actual phone/Home Screen operation and picture-only child comprehension require hands-on review; those are not established by automated tests.
