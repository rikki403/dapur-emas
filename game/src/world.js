// The game's rules and state, with no drawing and no browser in it: the chef,
// the stations, chopping, the wok, the plate, orders, combo, Rush Emas, the
// shift timer and the score. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react without the world knowing
// about screens or sound.
import {
  CHEF, CHOP_SECONDS, COOK_SECONDS, BURN_GRACE_SECONDS, WOK_MAX_ITEMS,
  SHIFT_SECONDS, RUSH_COMBO, RUSH_SECONDS, FLOOR, STATIONS, CRATES, STEP,
} from './config.js';
import { createRandom } from './random.js';
import { chopResult, cookResult, cratePick } from './ingredients.js';
import { matchRecipe } from './recipes.js';
import { createOrders, EVENT_ORDER_SERVED, EVENT_ORDER_EXPIRED, EVENT_ORDER_ARRIVED, EVENT_BURNT } from './orders.js';

export const EVENT_SERVED = 16;
export const EVENT_CHOP_DONE = 32;
export const EVENT_COOK_DONE = 64;
export const EVENT_OVER = 128;
export const EVENT_RUSH = 256;
export const EVENT_PICKUP = 512;
export { EVENT_ORDER_SERVED, EVENT_ORDER_EXPIRED, EVENT_ORDER_ARRIVED, EVENT_BURNT };

const STATION_NAMES = ['board', 'wok', 'plate'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rectCentre(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function createWorld(random) {
  const orders = createOrders(random);
  const state = {
    chef: { x: 640, y: 440, dir: 1, moving: false, chopAnim: 0 },
    hands: [],
    plate: [],
    wok: [],
    chopping: null,
    walkTarget: null,
    walkThenInteract: false,
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    rushUntil: -1,
    rushAnnounced: false,
    elapsed: 0,
    remaining: SHIFT_SECONDS,
    over: false,
    hint: 'Ambil bahan dari rak bawah, lalu masak!',
    hintUntil: 0,
    flash: 0,
    steam: [],
    particles: [],
    servedPop: null,
  };

  function reset() {
    state.chef.x = 640;
    state.chef.y = 440;
    state.chef.dir = 1;
    state.chef.moving = false;
    state.chef.chopAnim = 0;
    state.hands.length = 0;
    state.plate.length = 0;
    state.wok.length = 0;
    state.chopping = null;
    state.walkTarget = null;
    state.walkThenInteract = false;
    state.score = 0;
    state.coins = 0;
    state.served = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.rushUntil = -1;
    state.rushAnnounced = false;
    state.elapsed = 0;
    state.remaining = SHIFT_SECONDS;
    state.over = false;
    state.hint = 'Ambil bahan dari rak bawah, lalu masak!';
    state.hintUntil = 4;
    state.flash = 0;
    state.steam.length = 0;
    state.particles.length = 0;
    state.servedPop = null;
    orders.reset();
    orders.spawn(0);
    orders.spawn(0);
    seedSteam();
  }

  function seedSteam() {
    for (let i = 0; i < 14; i += 1) {
      state.steam.push({
        x: 690 + random() * 120, y: 150 + random() * 40,
        r: 5 + random() * 9, speed: 14 + random() * 18, wobble: random() * Math.PI * 2,
      });
    }
  }

  function setHint(text, seconds) {
    state.hint = text;
    state.hintUntil = state.elapsed + (seconds || 3);
  }

  function rushActive() {
    return state.elapsed < state.rushUntil;
  }

  function nearestStation() {
    const chef = state.chef;
    let best = null;
    let bestDist = 110;
    for (const name of STATION_NAMES) {
      const c = rectCentre(STATIONS[name]);
      const d = Math.hypot(chef.x - c.x, chef.y - c.y);
      if (d < bestDist) { bestDist = d; best = name; }
    }
    // Crates: nearest crate centre counts as the 'crates' station.
    for (const crate of CRATES) {
      const cx = crate.x + 50;
      const cy = STATIONS.crates.y + STATIONS.crates.h / 2;
      const d = Math.hypot(chef.x - cx, chef.y - cy);
      if (d < bestDist) { bestDist = d; best = 'crates'; }
    }
    return best;
  }

  function nearestCrate() {
    let best = null;
    let bestDist = 130;
    for (const crate of CRATES) {
      const cx = crate.x + 50;
      const cy = STATIONS.crates.y + STATIONS.crates.h / 2;
      const d = Math.hypot(state.chef.x - cx, state.chef.y - cy);
      if (d < bestDist) { bestDist = d; best = crate; }
    }
    return best;
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 40 + random() * 140;
      state.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
        life: 0.5 + random() * 0.5, max: 1, color, size: 3 + random() * 5,
      });
    }
  }

  /** The chef's one context action at the nearest station. Returns event flags. */
  function interact() {
    if (state.over || state.chopping) return 0;
    const station = nearestStation();
    if (!station) { setHint('Dekati stasiun dulu — papan cincang, wok, atau piring.', 2); return 0; }
    let events = 0;

    if (station === 'crates') {
      const crate = nearestCrate();
      if (!crate) return 0;
      if (state.hands.length >= CHEF.handCapacity) {
        setHint('Tangan penuh! Masak atau taruh dulu di piring.', 2);
        return 0;
      }
      const picked = cratePick(crate.id, state.hands);
      state.hands.push(picked);
      setHint('', 0);
      return EVENT_PICKUP;
    }

    if (station === 'board') {
      const idx = state.hands.findIndex((id) => chopResult(id));
      if (idx === -1) {
        setHint('Bawa ayam, sayur, atau bawang ke papan cincang.', 2.5);
        return 0;
      }
      state.chopping = { item: state.hands[idx], progress: 0, handIndex: idx };
      return 0;
    }

    if (station === 'wok') {
      // A finished item comes out first whenever the chef has a free hand.
      const done = state.wok.find((w) => w.cooked && !w.burnt);
      if (done && state.hands.length < CHEF.handCapacity) {
        state.wok.splice(state.wok.indexOf(done), 1);
        state.hands.push(done.result);
        return EVENT_PICKUP;
      }
      const burnt = state.wok.find((w) => w.burnt);
      if (burnt) {
        state.wok.splice(state.wok.indexOf(burnt), 1);
        setHint('Gosong! Buang dan masak lagi.', 2);
        return EVENT_BURNT;
      }
      if (state.wok.length > 0 && !done) {
        setHint('Masih dimasak… tunggu sampai matang!', 1.5);
        return 0;
      }
      const idx = state.hands.findIndex((id) => cookResult(id));
      if (idx === -1) {
        setHint('Wok butuh telur, mie, atau ayam cincang.', 2.5);
        return 0;
      }
      if (state.wok.length >= WOK_MAX_ITEMS) {
        setHint('Wok penuh — angkat dulu yang sudah matang.', 2);
        return 0;
      }
      const id = state.hands.splice(idx, 1)[0];
      state.wok.push({ item: id, result: cookResult(id), time: 0, cooked: false, burnt: false });
      burst(550, 200, '#ff9a2e', 8);
      return 0;
    }

    if (station === 'plate') {
      if (state.hands.length > 0) {
        for (const item of state.hands) state.plate.push(item);
        state.hands.length = 0;
        return 0;
      }
      if (state.plate.length === 0) {
        setHint('Piring kosong — taruh bahan dari tanganmu.', 2);
        return 0;
      }
      const recipe = matchRecipe(state.plate);
      if (!recipe) {
        setHint('Belum jadi resep — cek papan pesanan!', 2.5);
        return 0;
      }
      return serveDish(recipe);
    }

    return events;
  }

  function serveDish(recipe) {
    const order = orders.serve(recipe.id);
    if (!order) {
      setHint(`Tidak ada yang memesan ${recipe.name} sekarang.`, 2.5);
      return 0;
    }
    const patienceBonus = Math.round((order.patience / order.maxPatience) * 40);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const mult = 1 + 0.2 * (state.combo - 1);
    const rush = rushActive() ? 2 : 1;
    const gained = Math.round((recipe.base + patienceBonus) * mult * rush);
    state.score += gained;
    state.coins += gained;
    state.served += 1;
    state.plate.length = 0;
    state.servedPop = { text: `+${gained}`, recipe: recipe.name, combo: state.combo, life: 1.4 };
    state.flash = 0.35;
    burst(1090, 330, '#f6c453', recipe.golden ? 40 : 22);
    let events = EVENT_SERVED | EVENT_ORDER_SERVED;
    if (state.combo >= RUSH_COMBO && !state.rushAnnounced) {
      state.rushUntil = state.elapsed + RUSH_SECONDS;
      state.rushAnnounced = true;
      events |= EVENT_RUSH;
      setHint('RUSH EMAS! Poin ganda 15 detik!', 4);
    } else if (state.combo >= RUSH_COMBO && state.elapsed >= state.rushUntil) {
      // Re-trigger Rush Emas on a fresh 5-streak after it faded.
      state.rushUntil = state.elapsed + RUSH_SECONDS;
      events |= EVENT_RUSH;
    }
    return events;
  }

  function clearPlate() {
    if (state.plate.length === 0) return;
    state.plate.length = 0;
    setHint('Piring dibersihkan.', 1.5);
  }

  function step(dt, moveX, moveY, autoWalk, harmless) {
    let events = 0;
    if (state.over) return events;
    // The title screen's backdrop: only steam drifts, nothing scores.
    if (harmless) {
      for (const puff of state.steam) {
        puff.y -= puff.speed * dt;
        puff.wobble += dt * 2;
        if (puff.y < 120) {
          puff.y = 175;
          puff.x = 690 + random() * 120;
        }
      }
      return events;
    }
    state.elapsed += dt;
    state.remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    if (state.servedPop) {
      state.servedPop.life -= dt;
      if (state.servedPop.life <= 0) state.servedPop = null;
    }

    // Chopping progresses on its own once started.
    if (state.chopping) {
      state.chopping.progress += dt / CHOP_SECONDS;
      state.chef.chopAnim += dt;
      if (state.chopping.progress >= 1) {
        const done = state.chopping;
        state.hands[done.handIndex] = chopResult(done.item);
        state.chopping = null;
        state.chef.chopAnim = 0;
        burst(state.chef.x, state.chef.y - 30, '#8fd07a', 10);
        events |= EVENT_CHOP_DONE;
      }
    }

    // The wok cooks; items burn if left past the grace.
    for (const item of state.wok) {
      item.time += dt;
      if (!item.cooked && item.time >= COOK_SECONDS) {
        item.cooked = true;
        events |= EVENT_COOK_DONE;
      }
      if (item.cooked && !item.burnt && item.time >= COOK_SECONDS + BURN_GRACE_SECONDS) {
        item.burnt = true;
        events |= EVENT_BURNT;
      }
    }

    // Movement: keyboard, or the mouse walk target.
    const chef = state.chef;
    let vx = 0;
    let vy = 0;
    if (autoWalk && state.walkTarget) {
      const dx = state.walkTarget.x - chef.x;
      const dy = state.walkTarget.y - chef.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 12) {
        state.walkTarget = null;
        if (state.walkThenInteract) {
          state.walkThenInteract = false;
          events |= interact();
        }
      } else {
        vx = (dx / dist) * CHEF.speed;
        vy = (dy / dist) * CHEF.speed;
      }
    } else {
      vx = moveX * CHEF.speed;
      vy = moveY * CHEF.speed;
    }
    if (!state.chopping) {
      chef.x = clamp(chef.x + vx * dt, FLOOR.x + 20, FLOOR.x + FLOOR.w - 20);
      chef.y = clamp(chef.y + vy * dt, FLOOR.y + 10, FLOOR.y + FLOOR.h - 10);
      chef.moving = vx !== 0 || vy !== 0;
      if (vx > 0) chef.dir = 1;
      else if (vx < 0) chef.dir = -1;
    } else {
      chef.moving = false;
    }

    // Steam drifts up from the wok; particles fade.
    for (const puff of state.steam) {
      puff.y -= puff.speed * dt;
      puff.wobble += dt * 2;
      if (puff.y < 120) {
        puff.y = 175;
        puff.x = 690 + random() * 120;
      }
    }
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    // Orders tick; an expired ticket breaks the combo.
    const orderEvents = orders.step(dt, state.elapsed);
    if (orderEvents & EVENT_ORDER_EXPIRED) {
      if (state.combo > 0) setHint('Pesanan hangus — kombo putus!', 3);
      state.combo = 0;
      state.rushAnnounced = false;
    }
    events |= orderEvents;

    if (state.remaining <= 0) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  // The renderer asks the state which station the chef stands by.
  state.nearestStation = nearestStation;
  // …and which tickets sit on the order board.
  state.orders = orders;

  return {
    state, orders, reset, step, interact, clearPlate, nearestStation, nearestCrate,
    rushActive, setHint,
  };
}
