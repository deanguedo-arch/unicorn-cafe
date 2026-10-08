UNICORN WORLD SPORTS PARK V3

ART REPAIRS COMPLETED IN STATIC COMPOSITES
- Two original hard map joins are bridged with registered generated terrain overlays and narrow alpha-blend masks
- All three basketball states use the same separate ball at exactly 85 logical pixels
- Volleyball bump/hit ball size matches the measured fitted set ball at 96.815 logical pixels
- Tennis rackets remain fitted into the gripping hooves
- Source-matched hoop foreground masking preserves the original rope/rim geometry

START HERE
- review/Full_World_Seams_Repaired.png: character-free full world at 1536x3072
- actions/contact-fit-review.png: all ten sport states with actual equipment contact
- seams/Seam_Registration.json: exact overlay placement and alpha-band knots
- actions/action-manifest.json: state rectangles, pivots, ball centers, size and front/back layers
- docs/Sports_Park_v3_Art_Handoff.docx: complete editable integration brief

The original three terrain PNGs and canonical riding art remain unchanged. Apply the two masked seam overlays AFTER terrain and BEFORE actors/props. Raw unmasked overlays are not the final blend; use the SVG wrappers or exact declared alpha-band contract.

Basketball ready/aim sprites now have transparent ball slots. They must always be drawn with the separate ball behind the preserved gripping hooves. Release puts the same ball in front. Volleyball set alone retains its baked fitted ball: hide the world ball during set, then restore it at the documented exit point.

This is an art handoff, not an implemented game. Controls, collision geometry, physics, camera and saved state remain implementation work. Runtime verification must confirm masks, transitions and mirrored anchors behave as shown in the static proofs.

V1 and V2 remain available unchanged. Do not mix V2 basketball layers or old ball toggles with the V3 action manifest.
