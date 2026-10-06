# Sneaky Unicorn v12 — QA notes

Validated in this build environment:
- JavaScript syntax passes Node's parser for both script blocks.
- Four playable regular maps each retain 2 patrol opponents.
- Four regular maps each define a hidden room, baby rescue point, secret entrance, and rainbow slide.
- Secret treasure mapping is: House=picture, Market=donut, Restaurant=cake, Toy Store=picture.
- Police map contains 5 three-hit bandits plus 1 five-hit Boss Bandit with variable speed.
- Boss is configured to remain hidden until all five normal bandits are jailed.
- Camera clamps to the active base-map region or hidden-room region rather than the entire extended world.
- Regular-map jail locations remain on the base maps after hidden-room world extension.

Limitation: Chromium navigation is blocked by the execution environment administrator, so a full browser runtime playthrough could not be completed here. Physical iPhone playtesting remains required for feel and touch tuning.
