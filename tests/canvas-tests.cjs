#!/usr/bin/env node
'use strict';

/**
 * Rainbow Kitchen v1.0.0 — reproducible native Canvas validation.
 *
 * From the extracted source folder:
 *   npm install --no-save @napi-rs/canvas
 *   node tests/canvas-tests.cjs
 *
 * Or use an existing installation via NODE_PATH. The game itself has no npm
 * dependency; @napi-rs/canvas is needed only for these development tests.
 *
 * This does NOT launch or emulate a browser. It verifies source syntax, image
 * decoding, renderer state/size coverage, and renderer lifecycle behavior with
 * native Canvas. It does not test browser layout, pointer-event delivery,
 * audio, service workers, localStorage, or a physical iPhone.
 *
 * The script writes tests/canvas-results.json. It creates no screenshots.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

let canvasModule;
try {
  canvasModule = require('@napi-rs/canvas');
} catch (error) {
  console.error('Missing test dependency: @napi-rs/canvas. Install it in your Node environment, or set NODE_PATH to an existing installation.');
  process.exitCode = 1;
  return;
}

const {createCanvas, loadImage} = canvasModule;
const root = path.resolve(__dirname, '..');
const recipesPath = path.join(root, 'src', 'recipes.js');
const rendererPath = path.join(root, 'src', 'kitchen.js');
const assetDirectory = path.join(root, 'assets');
const outputPath = path.join(__dirname, 'canvas-results.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function testCanvas(width, height) {
  const canvas = createCanvas(width, height);
  // Supply the one layout API the renderer reads. There is deliberately no
  // fake browser DOM, event system, storage, audio engine or service worker.
  canvas.getBoundingClientRect = () => ({width, height});
  return canvas;
}

async function main() {
  const start = Date.now();
  const results = {
    status: 'RUNNING',
    executedAtUtc: new Date().toISOString(),
    version: '1.0.0',
    environment: {
      kind: 'Native Canvas; not a browser',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      canvasPackage: '@napi-rs/canvas'
    },
    sourceSha256: {
      'src/recipes.js': hash(recipesPath),
      'src/kitchen.js': hash(rendererPath)
    },
    tests: [],
    limitations: [
      'No browser was launched, and browser JavaScript/DOM compatibility was not verified by this harness.',
      'Canvas dimensions are native rendering sizes; they do not constitute responsive browser-layout tests.',
      'This harness does not test real pointer-event delivery, audio playback, localStorage, service workers, offline installation, or full gameplay flows.',
      'No physical iPhone or Safari device testing was performed by this harness.',
      'Successful rendering is an exception and asset-integrity check, not an automated judgment of visual quality.'
    ]
  };

  try {
    let scheduled = 0;
    const cancelled = [];
    const window = {
      devicePixelRatio: 1,
      matchMedia: () => ({matches: false}),
      requestAnimationFrame: () => ++scheduled,
      cancelAnimationFrame: id => cancelled.push(id)
    };
    const sandbox = vm.createContext({window});
    new vm.Script(fs.readFileSync(recipesPath, 'utf8'), {filename: recipesPath}).runInContext(sandbox);
    new vm.Script(fs.readFileSync(rendererPath, 'utf8'), {filename: rendererPath}).runInContext(sandbox);
    assert.equal(typeof window.KitchenScene, 'function');
    assert(Array.isArray(window.RECIPES));
    results.tests.push({name: 'source-syntax-and-public-api', status: 'PASS', files: ['src/recipes.js', 'src/kitchen.js']});

    const images = {};
    const foodFiles = fs.readdirSync(assetDirectory).filter(file => /^food-.+\.webp$/.test(file)).sort();
    for (const file of foodFiles) {
      const image = await loadImage(path.join(assetDirectory, file));
      assert(image.width > 0 && image.height > 0, 'Invalid image dimensions: ' + file);
      images[file.slice(5, -5)] = image;
    }
    assert(foodFiles.length > 0, 'No food assets found.');
    results.tests.push({name: 'food-image-decoding', status: 'PASS', loadedImages: foodFiles.length, files: foodFiles});

    const recipeIds = Array.from(window.RECIPES, recipe => recipe.id);
    assert.deepEqual(recipeIds, ['pizza', 'coffee', 'cupcakes', 'icecream', 'hamburger', 'soup', 'chicken']);
    const gestures = ['tap', 'spread', 'sprinkle', 'stir', 'pour', 'bake', 'scoop', 'stack'];
    for (const recipe of window.RECIPES) {
      assert(images[recipe.finalArt], 'Unresolved finalArt: ' + recipe.finalArt);
      assert(recipe.steps.length >= 4 && recipe.steps.length <= 5, 'Expected four or five preparation steps: ' + recipe.id);
      for (const step of recipe.steps) {
        assert(images[step.tool], 'Unresolved tool: ' + recipe.id + '/' + step.tool);
        assert(Number.isInteger(step.count) && step.count >= 1 && step.count <= 6, 'Invalid tap count: ' + recipe.id + '/' + step.id);
        assert(gestures.includes(step.gesture), 'Invalid gesture: ' + recipe.id + '/' + step.id);
      }
    }
    const rendererSource = fs.readFileSync(rendererPath, 'utf8');
    const literalArtKeys = new Set(Array.from(rendererSource.matchAll(/this\.(?:sprite|layer)\('([^']+)'/g), match => match[1]));
    for (const key of literalArtKeys) assert(images[key], 'Unresolved renderer bitmap: ' + key);
    results.tests.push({name: 'recipe-and-art-contract', status: 'PASS', recipes: recipeIds, literalRendererBitmapKeysChecked: literalArtKeys.size});

    const before = JSON.stringify(window.RECIPES);
    window.devicePixelRatio = 3;
    const canvas = testCanvas(320, 220);
    const scene = new window.KitchenScene(canvas, images);
    assert.equal(scene.dpr, 2);
    assert.equal(canvas.width, 640);
    assert.equal(canvas.height, 440);
    const constructorScheduled = scheduled;
    const input = Object.freeze({recipeId: 'pizza', stepIndex: 1, progress: .5, phase: 'cooking'});
    scene.setState(input);
    scene.stepAge = 7;
    scene.setState(input);
    assert.equal(scene.stepAge, 7, 'Updating the same step reset its animation age.');
    assert.equal(scheduled, constructorScheduled, 'setState scheduled another animation loop.');
    scene.interact(-100, 100);
    assert(Number.isFinite(scene.pointer.x) && Number.isFinite(scene.pointer.y));
    assert(scene.pointer.x >= -155 && scene.pointer.x <= 155);
    assert(scene.pointer.y >= -90 && scene.pointer.y <= 105);
    assert.equal(scene.s.progress, .5, 'Renderer interaction changed gameplay progress.');
    assert.equal(input.progress, .5);
    assert.equal(scheduled, constructorScheduled, 'interact scheduled another animation loop.');
    scene.frame(16);
    const activeToken = scene.raf;
    scene.destroy();
    assert.equal(cancelled.at(-1), activeToken, 'destroy did not cancel the current frame.');
    const afterDestroy = scheduled;
    scene.frame(32);
    scene.setState({recipeId: 'soup', stepIndex: 0, progress: 0, phase: 'cooking'});
    scene.interact(.5, .5);
    assert.equal(scheduled, afterDestroy, 'Renderer scheduled work after destroy.');
    assert.equal(JSON.stringify(window.RECIPES), before, 'Renderer mutated recipe definitions.');
    results.tests.push({
      name: 'renderer-lifecycle-and-state-ownership', status: 'PASS',
      checks: ['DPR capped at 2', '640×440 backing buffer for 320×220 display at DPR 3',
        'immutable input state and recipe definitions', 'same-step animation retained',
        'normalized and clamped interaction coordinates', 'interaction does not advance gameplay',
        'setState and interact do not create extra animation loops',
        'destroy cancels the active frame', 'destroy prevents rescheduling']
    });

    window.devicePixelRatio = 1;
    const dimensions = [[320, 220], [560, 320], [800, 460]];
    const progressValues = [0, .5, 1];
    let cookingCases = 0;
    let readyAndCelebrateCases = 0;
    const perRecipe = [];
    for (const recipe of window.RECIPES) {
      let recipeCookingCases = 0;
      for (let stepIndex = 0; stepIndex < recipe.steps.length; stepIndex++) {
        for (const progress of progressValues) {
          for (const [width, height] of dimensions) {
            const canvas = testCanvas(width, height);
            const scene = new window.KitchenScene(canvas, images);
            scene.setState(Object.freeze({recipeId: recipe.id, stepIndex, progress, phase: 'cooking'}));
            scene.interact(.5, .5);
            scene.frame(1000);
            scene.frame(1016);
            scene.destroy();
            cookingCases++;
            recipeCookingCases++;
          }
        }
      }
      for (const phase of ['ready', 'celebrate']) {
        const canvas = testCanvas(320, 220);
        const scene = new window.KitchenScene(canvas, images);
        scene.setState({recipeId: recipe.id, stepIndex: recipe.steps.length, progress: 1, phase});
        scene.frame(16);
        scene.destroy();
        readyAndCelebrateCases++;
      }
      perRecipe.push({id: recipe.id, steps: recipe.steps.length, cookingCases: recipeCookingCases, readyAndCelebrateCases: 2});
    }
    assert.equal(JSON.stringify(window.RECIPES), before, 'Render sweep mutated recipe definitions.');
    results.tests.push({
      name: 'native-canvas-state-and-size-sweep', status: 'PASS',
      cookingProgressValues: progressValues,
      cookingCanvasDimensions: dimensions.map(([width, height]) => ({width, height})),
      readyAndCelebrateCanvasDimensions: {width: 320, height: 220},
      cookingCases, readyAndCelebrateCases,
      totalCases: cookingCases + readyAndCelebrateCases,
      perRecipe
    });

    results.status = 'PASS';
    results.durationMs = Date.now() - start;
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify({status: results.status, foodImages: foodFiles.length, renderedCases: cookingCases + readyAndCelebrateCases, resultsFile: path.relative(root, outputPath)}));
  } catch (error) {
    results.status = 'FAIL';
    results.durationMs = Date.now() - start;
    results.failure = {message: error.message, stack: error.stack};
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2) + '\n');
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
