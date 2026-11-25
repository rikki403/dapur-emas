// Every tuning number, colour and layout constant in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One full shift, in seconds. */
export const SHIFT_SECONDS = 180;

export const CHEF = {
  radius: 26,
  speed: 270,
  handCapacity: 3,
};

/** Chopping takes this long, in seconds, per ingredient. */
export const CHOP_SECONDS = 1.1;
/** A wok item is perfectly cooked after this long, then burns after the grace. */
export const COOK_SECONDS = 3.5;
export const BURN_GRACE_SECONDS = 4.0;
/** How long a burnt item sits in the wok before it is cleared automatically. */
export const WOK_MAX_ITEMS = 2;
/** Orders: how many tickets can sit on the board at once. */
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 50;
export const ORDER_FIRST_INTERVAL = 10;
export const ORDER_INTERVAL_START = 13;
export const ORDER_INTERVAL_END = 7;
/** Combo of this size opens Rush Emas, which lasts this long. */
export const RUSH_COMBO = 5;
export const RUSH_SECONDS = 15;

export const PALETTE = {
  cream: '#f7ead7',
  creamDark: '#efdcbb',
  amber: '#e8a33d',
  gold: '#f6c453',
  goldDeep: '#c98a1b',
  red: '#b02a30',
  redDeep: '#7e1d22',
  charcoal: '#2b2118',
  ink: '#241a12',
  leaf: '#5d8a4a',
  leafDeep: '#3e5f31',
  wall: '#e9c9a0',
  wallTile: '#d98e5f',
  floor: '#c98a5e',
  floorDark: '#b57a4e',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  steel: '#cfd6dd',
  wok: '#3a3a3f',
  flameOrange: '#ff9a2e',
  flameYellow: '#ffd23f',
  ticket: '#fff8e7',
  hud: '#2b2118',
  steam: 'rgba(255,255,255,0.55)',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-emas.best';

/** Station rectangles, in playfield coordinates. */
export const STATIONS = {
  // Ingredient crates along the bottom wall.
  crates: { x: 288, y: 596, w: 976, h: 104 },
  // Chopping board, top-left of the floor.
  board: { x: 320, y: 222, w: 230, h: 100 },
  // Wok stove, top-centre.
  wok: { x: 610, y: 222, w: 280, h: 100 },
  // Plating counter, top-right. Serving happens here too.
  plate: { x: 950, y: 222, w: 230, h: 100 },
};

/** The floor the chef can walk on (inside the counters and walls). */
export const FLOOR = { x: 300, y: 330, w: 950, h: 250 };

/** Ingredient crates, left to right along the bottom counter. */
export const CRATES = [
  { id: 'nasi', label: 'Nasi', x: 296 },
  { id: 'telur', label: 'Telur', x: 404 },
  { id: 'mie', label: 'Mie', x: 512 },
  { id: 'ayam', label: 'Ayam', x: 620 },
  { id: 'sayur', label: 'Sayur', x: 728 },
  { id: 'bawang', label: 'Bawang', x: 836 },
  { id: 'kecap', label: 'Kecap', x: 944 },
  { id: 'bumbu', label: 'Bumbu', x: 1052 },
  { id: 'tusuk', label: 'Tusuk', x: 1160 },
];
