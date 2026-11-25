// The order board: tickets arrive, wait with a shrinking patience bar, and
// leave either served or expired.
import { MAX_ORDERS, ORDER_PATIENCE, ORDER_INTERVAL_START, ORDER_INTERVAL_END, SHIFT_SECONDS } from './config.js';
import { RECIPES } from './recipes.js';

export const EVENT_ORDER_SERVED = 1;
export const EVENT_ORDER_EXPIRED = 2;
export const EVENT_ORDER_ARRIVED = 4;
export const EVENT_BURNT = 8;

let nextOrderId = 1;

export function createOrders(random) {
  const list = [];
  let spawnTimer = 0;

  function pickRecipe(elapsed) {
    // Tumpeng Emas is rare: only after the first minute, about 1 in 8 orders.
    if (elapsed > 60 && random() < 0.12) return RECIPES[3];
    const roll = random();
    if (roll < 0.38) return RECIPES[0];
    if (roll < 0.7) return RECIPES[1];
    return RECIPES[2];
  }

  function spawn(elapsed) {
    if (list.length >= MAX_ORDERS) return null;
    const recipe = pickRecipe(elapsed);
    const order = {
      id: nextOrderId,
      recipe,
      patience: ORDER_PATIENCE,
      maxPatience: ORDER_PATIENCE,
      born: elapsed,
    };
    nextOrderId += 1;
    list.push(order);
    return order;
  }

  function reset() {
    list.length = 0;
    nextOrderId = 1;
    spawnTimer = 0;
  }

  /** Advance timers; returns a bitmask of what happened. */
  function step(dt, elapsed) {
    let events = 0;
    for (let i = list.length - 1; i >= 0; i -= 1) {
      list[i].patience -= dt;
      if (list[i].patience <= 0) {
        list.splice(i, 1);
        events |= EVENT_ORDER_EXPIRED;
      }
    }
    spawnTimer -= dt;
    if (spawnTimer <= 0 && list.length < MAX_ORDERS) {
      const progress = Math.min(1, elapsed / SHIFT_SECONDS);
      const interval = ORDER_INTERVAL_START + (ORDER_INTERVAL_END - ORDER_INTERVAL_START) * progress;
      spawnTimer = interval * (0.85 + random() * 0.3);
      if (spawn(elapsed)) events |= EVENT_ORDER_ARRIVED;
    }
    return events;
  }

  function serve(recipeId) {
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].recipe.id === recipeId) {
        const order = list[i];
        list.splice(i, 1);
        return order;
      }
    }
    return null;
  }

  return { list, reset, step, spawn, serve };
}
