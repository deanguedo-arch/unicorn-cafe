# Rainbow Kitchen v1.0.0 build contract

This is a new Sneaky Unicorn cooking game. No adventure rules, violence, jail, timers, currency, data collection, or third-party runtime dependencies. All seven dishes must work and be selectable at any time.

## Module ownership

- Root: `src/index.html`, `src/style.css`, `src/app.js`, assets map, distribution build.
- Kitchen renderer agent: `src/recipes.js`, `src/kitchen.js` only, with no imports or network.
- Art agents: generated PNGs and explicitly assigned asset files/provenance only.

## Public browser API

`window.RECIPES` is an ordered array: pizza, coffee, cupcakes, icecream, hamburger, soup, chicken.

Each recipe: `{id, name, shortName, finalArt, color, steps:[{id,label,verb,tool,gesture,count}]}`.

- `gesture` one of tap, spread, sprinkle, stir, pour, bake, scoop, stack.
- `count` is an integer 1–6; it is the number of forgiving tap equivalents needed.
- `tool` and `finalArt` are keys of the images object. All steps have a tap alternative.
- Dish names shown to parents must include chicken with sweet potatoes.

`window.KitchenScene` is a constructor `(canvas, images)`.

Methods:
- `setState({recipeId, stepIndex, progress, phase})`: progress 0–1 of CURRENT step; phase cooking/ready/celebrate. Previous steps are completed. StepIndex may equal steps.length only for ready/celebrate. Do not restart animation every state update.
- `interact(x, y)`: x,y are normalized 0–1 canvas-local coordinates; give a visual tactile response. No state mutation, no audio.
- `resize()` responds to layout/DPR.
- `destroy()` stops its animation loop.

Renderer owns requestAnimationFrame; cap DPR at 2 and delta time. Treat `prefers-reduced-motion` politely. Images object maps keys to loaded HTMLImageElement. Render a large food under preparation with distinct visible changes; real bitmap assets for food/props, deterministic Canvas shapes allowed for utensils, counter, platter, liquids, flames, motion/sparkles and tactile effects. Canvas works at any ratio (roughly 320x220 to 800x460); composition must preserve whole central food.

## Planned art keys

`pizza`, `coffee`, `cupcakes`, `icecream`, `hamburger`, `soup`, `chicken`, `plate`, `dough`, `saucedDough`, `rawPizza`, `emptyMug`, `mixingBowl`, `plainCupcake`, `cone`, `vegetablePot`, `tomato`, `cheese`, `lettuce`, `bun`, `patty`, `drumstick`, `sweetPotato`, `vegetables`, `milk`, `coffeePot`, `pinkScoop`, `vanillaScoop`, `rollingPin`, `sauceSpoon`, `pipingBag`, `sprinkles`.

Root will load all art before starting the game; no placeholder fallback should be silently introduced if a required image fails. Source character assets separate from food keys: chefIdle, chefHappy, babyPink, babyPinkHappy, babyBlue, babyBlueHappy, customerHappy, hero, restaurant.

## Root interaction/state model

Home → picture order + recipe menu → cooking (4–5 steps) → ready → serve → celebration → next order. Wrong cooked dish offered to customer gives friendly puzzled/order reminder plus baby snack; does not advance order or award stamp; retry starts requested recipe. Menu switch/restart supports new dish without losing collected stamps. Persist order queue, current recipe, step progress, earned stamps, total correct serves, sound preference; restore exact safe state after reload. Save exceptions must not crash.

Cooking input: pointer taps at the food count; broad drag travel adds equivalent progress at a capped rate. The large current-tool button also counts one step tap. A brief step transition prevents a single drag consuming the entire recipe. Bake is a short triggered animation; no precision/time-limit requirement. Repeat home/start and next-customer flows work. UI has mute, recipe book, home, replay and restart recipe controls.
