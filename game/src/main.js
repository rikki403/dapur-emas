// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=cover|chop|serve|rush (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP, STATIONS } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_SERVED, EVENT_CHOP_DONE, EVENT_COOK_DONE, EVENT_PICKUP, EVENT_RUSH, EVENT_BURNT, EVENT_ORDER_EXPIRED } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_INTERACT, ACTION_CLEAR, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { playPickup, playChop, playCookDone, playServe, playRush, playBurnt, playExpired, playClick } from './audio.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Debug hook for automated play-testing (read-only state inspection).
  window.__dapur = { world, get screen() { return screen; } };

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Bermain. Sajikan pesanan sebelum waktunya habis!');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SERVED) playServe();
    if (events & EVENT_CHOP_DONE) playChop();
    if (events & EVENT_COOK_DONE) playCookDone();
    if (events & EVENT_PICKUP) playPickup();
    if (events & EVENT_RUSH) playRush();
    if (events & EVENT_BURNT) playBurnt();
    if (events & EVENT_ORDER_EXPIRED) playExpired();
    if (events & EVENT_OVER) endGame();
  }

  function handleClick() {
    const click = input.takeClick();
    if (!click) return;
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      playClick();
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    // Clicking a station walks there and interacts on arrival; clicking the
    // floor just walks there.
    const chef = world.state.chef;
    let target = { x: click.x, y: click.y };
    let interactOnArrival = false;
    const stations = [
      { name: 'board', rect: STATIONS.board },
      { name: 'wok', rect: STATIONS.wok },
      { name: 'plate', rect: STATIONS.plate },
      { name: 'crates', rect: STATIONS.crates },
    ];
    for (const station of stations) {
      const r = station.rect;
      if (click.x >= r.x - 10 && click.x <= r.x + r.w + 10 && click.y >= r.y - 10 && click.y <= r.y + r.h + 10) {
        target = { x: r.x + r.w / 2, y: r.y + r.h + 30 };
        interactOnArrival = true;
        break;
      }
    }
    // Clamp the walk target onto the floor.
    target.x = Math.min(1240, Math.max(310, target.x));
    target.y = Math.min(565, Math.max(340, target.y));
    world.state.walkTarget = target;
    world.state.walkThenInteract = interactOnArrival;
    void chef;
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Bermain.');
    }
    if (screen !== SCREEN_PLAY) return;
    if (actions & ACTION_INTERACT) {
      world.state.walkTarget = null;
      handleEvents(world.interact());
    }
    if (actions & ACTION_CLEAR) world.clearPlate();
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The title screen's backdrop simmers: steam rises, nothing scores.
      world.step(STEP, 0, 0, false, true);
      return;
    }
    const dir = input.direction();
    const events = world.step(STEP, dir.x, dir.y, true);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleClick();
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Dapur Emas. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
