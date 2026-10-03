/* Sneaky Unicorn: Rainbow Kitchen — original restaurant recipes, v1.0.0.
 * Each gesture has a forgiving tap/button equivalent in app.js.
 * These are pretend-play recipes, not instructions for using a real kitchen.
 */
(function () {
  'use strict';
  window.RECIPES = [
    {
      id: 'pizza', name: 'Pizza', shortName: 'Pizza', finalArt: 'pizza', color: '#f8b46a',
      steps: [
        {id: 'roll', label: 'Roll the dough', verb: 'Roll', tool: 'rollingPin', gesture: 'spread', count: 3},
        {id: 'sauce', label: 'Spread the sauce', verb: 'Spread', tool: 'sauceSpoon', gesture: 'spread', count: 3},
        {id: 'cheese', label: 'Sprinkle the cheese', verb: 'Sprinkle', tool: 'cheese', gesture: 'sprinkle', count: 3},
        {id: 'toppings', label: 'Pop on the tomatoes', verb: 'Add', tool: 'tomatoSlice', gesture: 'stack', count: 3},
        {id: 'bake', label: 'Bake your pizza', verb: 'Bake', tool: 'rawPizza', gesture: 'bake', count: 1}
      ]
    },
    {
      id: 'coffee', name: 'Coffee', shortName: 'Coffee', finalArt: 'coffee', color: '#62c9cb',
      steps: [
        {id: 'grounds', label: 'Add the coffee beans', verb: 'Add', tool: 'coffeeBeans', gesture: 'stack', count: 2},
        {id: 'brew', label: 'Brew into the cup', verb: 'Brew', tool: 'coffeePot', gesture: 'pour', count: 3},
        {id: 'milk', label: 'Add a little milk', verb: 'Pour', tool: 'milk', gesture: 'pour', count: 2},
        {id: 'stir', label: 'Stir a swirly coffee', verb: 'Stir', tool: 'plainSpoon', gesture: 'stir', count: 4}
      ]
    },
    {
      id: 'cupcakes', name: 'Cupcakes', shortName: 'Cupcakes', finalArt: 'cupcakes', color: '#f58db5',
      steps: [
        {id: 'mix', label: 'Mix the batter', verb: 'Mix', tool: 'mixingBowl', gesture: 'stir', count: 4},
        {id: 'fill', label: 'Fill three little cases', verb: 'Pour', tool: 'mixingBowl', gesture: 'pour', count: 3},
        {id: 'bake', label: 'Bake the cupcakes', verb: 'Bake', tool: 'plainCupcake', gesture: 'bake', count: 1},
        {id: 'frost', label: 'Make pink frosting swirls', verb: 'Swirl', tool: 'pipingBag', gesture: 'spread', count: 3},
        {id: 'sprinkles', label: 'Shake on rainbow sprinkles', verb: 'Sprinkle', tool: 'sprinkles', gesture: 'sprinkle', count: 3}
      ]
    },
    {
      id: 'icecream', name: 'Ice cream', shortName: 'Ice cream', finalArt: 'icecream', color: '#b9a1ec',
      steps: [
        {id: 'cone', label: 'Choose a crunchy cone', verb: 'Pick', tool: 'cone', gesture: 'stack', count: 1},
        {id: 'strawberry', label: 'Scoop the strawberry', verb: 'Scoop', tool: 'pinkScoop', gesture: 'scoop', count: 2},
        {id: 'vanilla', label: 'Add a vanilla scoop', verb: 'Scoop', tool: 'vanillaScoop', gesture: 'scoop', count: 2},
        {id: 'lavender', label: 'Add a purple scoop', verb: 'Scoop', tool: 'lavenderScoop', gesture: 'scoop', count: 2},
        {id: 'sauce', label: 'Drizzle a swirly topping', verb: 'Drizzle', tool: 'berrySauce', gesture: 'spread', count: 3}
      ]
    },
    {
      id: 'hamburger', name: 'Hamburger', shortName: 'Burger', finalArt: 'hamburger', color: '#b4d779',
      steps: [
        {id: 'grill', label: 'Sizzle the burger', verb: 'Sizzle', tool: 'patty', gesture: 'bake', count: 1},
        {id: 'flip', label: 'Flip it over', verb: 'Flip', tool: 'patty', gesture: 'tap', count: 1},
        {id: 'stack', label: 'Stack the burger and cheese', verb: 'Stack', tool: 'cheeseSlice', gesture: 'stack', count: 2},
        {id: 'greens', label: 'Add tomato and lettuce', verb: 'Add', tool: 'lettuce', gesture: 'stack', count: 2},
        {id: 'cap', label: 'Pop the bun on top', verb: 'Pop', tool: 'bun', gesture: 'stack', count: 1}
      ]
    },
    {
      id: 'soup', name: 'Soup', shortName: 'Soup', finalArt: 'soup', color: '#d2b0ee',
      steps: [
        {id: 'vegetables', label: 'Plop in the vegetables', verb: 'Plop', tool: 'vegetables', gesture: 'stack', count: 3},
        {id: 'broth', label: 'Pour the broth', verb: 'Pour', tool: 'vegetablePot', gesture: 'pour', count: 3},
        {id: 'stir', label: 'Stir the rainbow soup', verb: 'Stir', tool: 'plainSpoon', gesture: 'stir', count: 4},
        {id: 'simmer', label: 'Make happy little bubbles', verb: 'Bubble', tool: 'vegetablePot', gesture: 'bake', count: 1},
        {id: 'ladle', label: 'Ladle soup into the bowl', verb: 'Ladle', tool: 'plainSpoon', gesture: 'pour', count: 2}
      ]
    },
    {
      id: 'chicken', name: 'Chicken with sweet potatoes', shortName: 'Chicken', finalArt: 'chicken', color: '#f0b877',
      steps: [
        {id: 'tray', label: 'Put chicken on the tray', verb: 'Place', tool: 'rawDrumstick', gesture: 'stack', count: 1},
        {id: 'potatoes', label: 'Add the sweet potatoes', verb: 'Add', tool: 'sweetPotatoWedges', gesture: 'stack', count: 3},
        {id: 'brush', label: 'Brush on a shiny glaze', verb: 'Brush', tool: 'plainSpoon', gesture: 'spread', count: 3},
        {id: 'roast', label: 'Roast your colourful dinner', verb: 'Roast', tool: 'chicken', gesture: 'bake', count: 1},
        {id: 'plate', label: 'Put dinner on the plate', verb: 'Plate', tool: 'plate', gesture: 'stack', count: 1}
      ]
    }
  ];
})();
