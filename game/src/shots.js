// The screenshot scenes behind ?shot=cover|chop|serve|rush. Each one stages
// a real game state through the world's own rules — real orders, a real wok,
// a real plate — then steps the world a few frames so steam and particles
// settle, so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { STEP } from './config.js';
import { RECIPES } from './recipes.js';
import { SCREEN_PLAY } from './render.js';

function pushOrder(world, recipe, patience) {
  world.orders.list.push({
    id: world.orders.list.length + 1,
    recipe,
    patience,
    maxPatience: 50,
    born: world.state.elapsed,
  });
}

function settle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, 0, 0, false);
}

function baseScene(world, elapsed, score, served, combo) {
  world.reset();
  world.state.elapsed = elapsed;
  world.state.remaining = 180 - elapsed;
  world.state.score = score;
  world.state.coins = score;
  world.state.served = served;
  world.state.combo = combo;
  world.state.bestCombo = Math.max(combo, 3);
  world.orders.list.length = 0;
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'chop') {
    baseScene(world, 42, 180, 2, 1);
    pushOrder(world, RECIPES[0], 38);
    pushOrder(world, RECIPES[1], 24);
    world.state.chef.x = 435;
    world.state.chef.y = 380;
    world.state.hands.push('ayam');
    world.state.chopping = { item: 'ayam', progress: 0.55, handIndex: 0 };
    world.state.chef.chopAnim = 0.4;
    world.state.hint = 'Cincang ayamnya sampai halus…';
    world.state.hintUntil = 999;
    settle(world, 0.1);
    return { screen: SCREEN_PLAY, best: 180 };
  }

  if (name === 'serve') {
    baseScene(world, 96, 540, 5, 4);
    pushOrder(world, RECIPES[0], 31);
    pushOrder(world, RECIPES[2], 18);
    world.state.chef.x = 1065;
    world.state.chef.y = 380;
    world.state.plate.push('nasi', 'telur-goreng', 'bawang-cincang', 'kecap');
    world.state.servedPop = { text: '+168', recipe: 'Nasi Goreng Emas', combo: 4, life: 1.4 };
    world.state.flash = 0.2;
    world.state.hint = 'Nasi Goreng Emas siap — sajikan!';
    world.state.hintUntil = 999;
    settle(world, 0.3);
    return { screen: SCREEN_PLAY, best: 540 };
  }

  if (name === 'rush') {
    baseScene(world, 128, 860, 8, 5);
    world.state.rushUntil = world.state.elapsed + 12;
    world.state.rushAnnounced = true;
    pushOrder(world, RECIPES[3], 40);
    pushOrder(world, RECIPES[1], 26);
    pushOrder(world, RECIPES[0], 12);
    world.state.chef.x = 760;
    world.state.chef.y = 420;
    world.state.chef.dir = 1;
    world.state.hands.push('nasi', 'kecap');
    world.state.plate.push('telur-goreng', 'ayam-panggang');
    world.state.wok.push({ item: 'mie', result: 'mie-goreng', time: 3.6, cooked: true, burnt: false });
    world.state.servedPop = { text: '+312', recipe: 'Sate Ayam', combo: 5, life: 1.2 };
    world.state.flash = 0.25;
    settle(world, 0.4);
    return { screen: SCREEN_PLAY, best: 860 };
  }

  // Cover: the fullest mid-rush scene — three tickets, ingredients on the
  // counter, a dish mid-assembly, the wok firing, the timer running.
  baseScene(world, 70, 420, 4, 3);
  pushOrder(world, RECIPES[0], 34);
  pushOrder(world, RECIPES[1], 27);
  pushOrder(world, RECIPES[3], 44);
  world.state.chef.x = 700;
  world.state.chef.y = 430;
  world.state.chef.dir = -1;
  world.state.hands.push('nasi', 'kecap');
  world.state.plate.push('telur-goreng', 'bawang-cincang');
  world.state.wok.push({ item: 'telur', result: 'telur-goreng', time: 2.2, cooked: false, burnt: false });
  world.state.hint = 'Wok hampir matang — angkat, lalu rakit di piring!';
  world.state.hintUntil = 999;
  settle(world, 0.6);
  return { screen: SCREEN_PLAY, best: 420 };
}
