// Keyboard and mouse: WASD/arrows move, E/Space interacts, X clears the
// plate, P pauses, click walks the chef to a station (or a spot) and
// interacts on arrival. Actions are edge-triggered and consumed once.
export const ACTION_INTERACT = 1;
export const ACTION_CLEAR = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_PAUSE = 8;

export function createInput(canvas, toWorld) {
  const keys = new Set();
  let actions = 0;
  let click = null;

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === 'e' || key === ' ') actions |= ACTION_INTERACT;
    if (key === ' ' || key === 'enter') actions |= ACTION_CONFIRM;
    if (key === 'x') actions |= ACTION_CLEAR;
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
  }

  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function pointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  function direction() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  function takeClick() {
    const taken = click;
    click = null;
    return taken;
  }

  return { direction, takeActions, takeClick, toWorld };
}
