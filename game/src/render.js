// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred. Food is
// drawn from layered canvas shapes with shading, so every dish looks worth
// serving; no image files, no network.
import { FIELD, FONT, PALETTE, STATIONS, CRATES, BEST_KEY } from './config.js';
import { ingredientName } from './ingredients.js';
import { matchRecipe, plateHint } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, `${weight || ''} ${size}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function label(value, x, y, size, color, align) {
    text(value, x, y, size, color, align, 'bold');
  }

  // ---------- food icons, drawn from layered shapes ----------
  function drawFood(id, x, y, s) {
    const u = s / 40;
    ctx.save();
    ctx.translate(x, y);
    if (id === 'nasi') {
      ctx.fillStyle = '#c96a2e'; ellipse(ctx, 0, 6 * u, 17 * u, 7 * u); ctx.fill();
      ctx.fillStyle = '#fff6e0';
      circle(ctx, -6 * u, 0, 7 * u); ctx.fill();
      circle(ctx, 5 * u, -2 * u, 8 * u); ctx.fill();
      circle(ctx, 0, -5 * u, 6 * u); ctx.fill();
      ctx.fillStyle = '#e8d5a8';
      circle(ctx, -7 * u, 2 * u, 2.5 * u); ctx.fill();
      circle(ctx, 6 * u, 1 * u, 2 * u); ctx.fill();
    } else if (id === 'telur') {
      ctx.fillStyle = '#fff3d6'; ellipse(ctx, 0, 0, 14 * u, 17 * u); ctx.fill();
      ctx.fillStyle = '#f2b544'; circle(ctx, 0, 2 * u, 7 * u); ctx.fill();
      ctx.fillStyle = '#ffd970'; circle(ctx, -2 * u, 0, 3 * u); ctx.fill();
    } else if (id === 'telur-goreng') {
      ctx.fillStyle = '#fff8e2';
      circle(ctx, -5 * u, 2 * u, 9 * u); ctx.fill();
      circle(ctx, 6 * u, -3 * u, 10 * u); ctx.fill();
      circle(ctx, 0, 5 * u, 8 * u); ctx.fill();
      ctx.fillStyle = '#e8a33d'; circle(ctx, 1 * u, 0, 8 * u); ctx.fill();
      ctx.fillStyle = '#f6c453'; circle(ctx, -1 * u, -2 * u, 4.5 * u); ctx.fill();
      ctx.fillStyle = '#c97a1e';
      circle(ctx, 8 * u, 6 * u, 1.6 * u); ctx.fill();
      circle(ctx, -9 * u, -6 * u, 1.4 * u); ctx.fill();
    } else if (id === 'mie' || id === 'mie-goreng') {
      ctx.strokeStyle = id === 'mie' ? '#f7d774' : '#d99a35';
      ctx.lineWidth = 3.4 * u; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(0, (i - 1.5) * 6 * u, 13 * u - i * 1.5 * u, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      if (id === 'mie-goreng') {
        ctx.fillStyle = '#5da244';
        circle(ctx, -8 * u, -6 * u, 2.6 * u); ctx.fill();
        circle(ctx, 7 * u, 4 * u, 2.4 * u); ctx.fill();
        ctx.fillStyle = '#c96a4a';
        circle(ctx, 2 * u, -8 * u, 2.4 * u); ctx.fill();
      }
    } else if (id === 'ayam' || id === 'ayam-panggang') {
      ctx.fillStyle = id === 'ayam' ? '#f2b8a0' : '#b06a2e';
      ellipse(ctx, -2 * u, -2 * u, 13 * u, 11 * u); ctx.fill();
      ctx.strokeStyle = '#f7ead7'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(9 * u, 7 * u); ctx.lineTo(17 * u, 15 * u); ctx.stroke();
      ctx.fillStyle = '#f7ead7';
      circle(ctx, 15 * u, 11 * u, 3.4 * u); ctx.fill();
      circle(ctx, 19 * u, 15 * u, 3.4 * u); ctx.fill();
      if (id === 'ayam-panggang') {
        ctx.strokeStyle = '#7e3f16'; ctx.lineWidth = 2.4 * u;
        ctx.beginPath(); ctx.moveTo(-10 * u, -8 * u); ctx.lineTo(-2 * u, 4 * u); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-2 * u, -10 * u); ctx.lineTo(6 * u, 2 * u); ctx.stroke();
      }
    } else if (id === 'ayam-cincang') {
      ctx.fillStyle = '#e89a7a';
      for (const [dx, dy] of [[-8, -4], [2, -8], [8, 2], [-2, 6]]) {
        rr(ctx, dx * u - 5 * u, dy * u - 4 * u, 10 * u, 8 * u, 2 * u); ctx.fill();
      }
      ctx.fillStyle = '#b85a3a';
      circle(ctx, -6 * u, -2 * u, 1.6 * u); ctx.fill();
      circle(ctx, 6 * u, 4 * u, 1.6 * u); ctx.fill();
    } else if (id === 'sayur') {
      ctx.fillStyle = '#5da244';
      ellipse(ctx, -6 * u, 0, 8 * u, 12 * u); ctx.fill();
      ellipse(ctx, 6 * u, 0, 8 * u, 12 * u); ctx.fill();
      ctx.fillStyle = '#7fbf5a';
      ellipse(ctx, 0, -4 * u, 7 * u, 11 * u); ctx.fill();
      ctx.strokeStyle = '#2f5c22'; ctx.lineWidth = 1.6 * u;
      ctx.beginPath(); ctx.moveTo(0, -14 * u); ctx.lineTo(0, 8 * u); ctx.stroke();
    } else if (id === 'sayur-cincang') {
      ctx.fillStyle = '#5da244';
      for (const [dx, dy] of [[-9, -3], [0, -8], [9, -2], [-4, 6], [6, 7]]) {
        circle(ctx, dx * u, dy * u, 4.4 * u); ctx.fill();
      }
      ctx.fillStyle = '#7fbf5a';
      circle(ctx, -9 * u, -3 * u, 2 * u); ctx.fill();
      circle(ctx, 6 * u, 7 * u, 2 * u); ctx.fill();
    } else if (id === 'bawang') {
      ctx.fillStyle = '#e8c8e0';
      circle(ctx, 0, 0, 13 * u); ctx.fill();
      ctx.strokeStyle = '#a86a9a'; ctx.lineWidth = 2.2 * u;
      circle(ctx, 0, 0, 9 * u); ctx.stroke();
      circle(ctx, 0, 0, 5 * u); ctx.stroke();
      ctx.fillStyle = '#5da244';
      ellipse(ctx, 0, -14 * u, 3 * u, 6 * u); ctx.fill();
    } else if (id === 'bawang-cincang') {
      ctx.fillStyle = '#d9a8cc';
      for (const [dx, dy] of [[-8, -4], [1, -8], [9, 0], [-3, 6], [5, 8]]) {
        rr(ctx, dx * u - 4.4 * u, dy * u - 3 * u, 8.8 * u, 6 * u, 2 * u); ctx.fill();
      }
      ctx.fillStyle = '#8a4a7a';
      circle(ctx, -8 * u, -4 * u, 1.5 * u); ctx.fill();
      circle(ctx, 5 * u, 8 * u, 1.5 * u); ctx.fill();
    } else if (id === 'kecap') {
      ctx.fillStyle = '#b02a30'; rr(ctx, -5 * u, -16 * u, 10 * u, 7 * u, 2 * u); ctx.fill();
      ctx.fillStyle = '#5a2e18'; rr(ctx, -8 * u, -9 * u, 16 * u, 24 * u, 4 * u); ctx.fill();
      ctx.fillStyle = '#f7ead7'; rr(ctx, -8 * u, -2 * u, 16 * u, 8 * u, 2 * u); ctx.fill();
      ctx.fillStyle = '#b02a30'; text('K', 0, 5.5 * u, 9 * u, '#b02a30', 'center', 'bold');
    } else if (id === 'bumbu') {
      ctx.fillStyle = '#8a5a33'; ellipse(ctx, 0, 6 * u, 16 * u, 6 * u); ctx.fill();
      ctx.fillStyle = '#c98a3a'; ellipse(ctx, 0, 3 * u, 14 * u, 6 * u); ctx.fill();
      ctx.strokeStyle = '#7a4a16'; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.arc(0, 3 * u, 8 * u, Math.PI * 0.2, Math.PI * 1.1); ctx.stroke();
      ctx.fillStyle = '#e8a33d';
      circle(ctx, -6 * u, 1 * u, 1.8 * u); ctx.fill();
      circle(ctx, 5 * u, 4 * u, 1.8 * u); ctx.fill();
    } else if (id === 'tusuk') {
      ctx.strokeStyle = '#d9b078'; ctx.lineWidth = 2.6 * u; ctx.lineCap = 'round';
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath(); ctx.moveTo(dx * u, -14 * u); ctx.lineTo(dx * u, 14 * u); ctx.stroke();
      }
      ctx.fillStyle = '#b06a2e';
      circle(ctx, -8 * u, -4 * u, 4 * u); ctx.fill();
      circle(ctx, 0, 2 * u, 4 * u); ctx.fill();
      circle(ctx, 8 * u, -6 * u, 4 * u); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- the kitchen ----------
  function drawWall(time) {
    // Terracotta tile wall, top band of the kitchen.
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(288, 56, 976, 160);
    ctx.fillStyle = PALETTE.wallTile;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 13; col += 1) {
        ctx.globalAlpha = (row + col) % 2 === 0 ? 0.16 : 0.08;
        ctx.fillRect(288 + col * 76 + (row % 2) * 38, 56 + row * 40, 72, 36);
      }
    }
    ctx.globalAlpha = 1;
    // Window with a warm sunset.
    ctx.fillStyle = '#7a4a2e';
    rr(ctx, 316, 72, 240, 128, 8); ctx.fill();
    const grad = ctx.createLinearGradient(0, 80, 0, 192);
    grad.addColorStop(0, '#ffcf7a');
    grad.addColorStop(0.55, '#ff9a4a');
    grad.addColorStop(1, '#e86a5a');
    ctx.fillStyle = grad;
    rr(ctx, 324, 80, 224, 112, 5); ctx.fill();
    ctx.fillStyle = '#fff3c9';
    circle(ctx, 500, 110, 20); ctx.fill();
    ctx.fillStyle = '#c96a4a';
    ctx.fillRect(324, 168, 224, 5);
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(432, 80, 6, 112);
    // Sunset light rays across the wall.
    ctx.fillStyle = 'rgba(255, 220, 140, 0.18)';
    ctx.beginPath();
    ctx.moveTo(330, 200); ctx.lineTo(560, 200); ctx.lineTo(700, 330); ctx.lineTo(470, 330);
    ctx.closePath(); ctx.fill();
    // Hanging copper pans.
    for (let i = 0; i < 3; i += 1) {
      const px = 620 + i * 62;
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, 72); ctx.lineTo(px, 92); ctx.stroke();
      ctx.fillStyle = i === 1 ? '#b06a2e' : '#d98a4a';
      circle(ctx, px, 116, 24); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      circle(ctx, px - 7, 108, 7); ctx.fill();
    }
    // Herb pots on a shelf.
    ctx.fillStyle = '#7a4a2e';
    ctx.fillRect(820, 150, 180, 8);
    for (let i = 0; i < 3; i += 1) {
      const px = 850 + i * 60;
      ctx.fillStyle = '#b06a2e';
      rr(ctx, px - 13, 122, 26, 28, 4); ctx.fill();
      ctx.fillStyle = PALETTE.leaf;
      circle(ctx, px, 112, 10); ctx.fill();
      circle(ctx, px - 9, 118, 7); ctx.fill();
      circle(ctx, px + 9, 118, 7); ctx.fill();
    }
    // Golden sign.
    ctx.fillStyle = PALETTE.charcoal;
    rr(ctx, 1040, 84, 200, 52, 10); ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    label('DAPUR EMAS', 1140, 106, 24, PALETTE.gold, 'center');
    text('Golden Kitchen Rush', 1140, 128, 13, PALETTE.cream, 'center');
    void time;
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(288, 330, 976, 250);
    ctx.fillStyle = PALETTE.floorDark;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 13; col += 1) {
        if ((row + col) % 2 === 0) ctx.fillRect(288 + col * 76 + (row % 2) * 38 - 38, 330 + row * 50, 74, 48);
      }
    }
    // Woven rug under the stations.
    ctx.fillStyle = '#a83a3a';
    rr(ctx, 560, 340, 420, 120, 14); ctx.fill();
    ctx.fillStyle = '#e8a33d';
    rr(ctx, 576, 356, 388, 88, 10); ctx.fill();
    ctx.fillStyle = '#a83a3a';
    rr(ctx, 592, 372, 356, 56, 8); ctx.fill();
  }

  function drawCat() {
    // The kitchen cat, asleep in the corner.
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ellipse(ctx, 150, 668, 74, 12); ctx.fill();
    ctx.fillStyle = '#e8a33d';
    ellipse(ctx, 148, 652, 52, 20); ctx.fill();
    circle(ctx, 196, 646, 16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(186, 634); ctx.lineTo(190, 622); ctx.lineTo(196, 634); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(200, 632); ctx.lineTo(206, 622); ctx.lineTo(210, 634); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7ead7';
    ellipse(ctx, 132, 658, 22, 10); ctx.fill();
    ctx.strokeStyle = '#7a4a16'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(96, 648); ctx.quadraticCurveTo(70, 640, 66, 622); ctx.stroke();
    ctx.fillStyle = PALETTE.charcoal;
    text('Z z z', 224, 622, 16, PALETTE.charcoal, 'left', 'bold');
  }

  function drawCrates(state, station) {
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, STATIONS.crates.x, STATIONS.crates.y, STATIONS.crates.w, STATIONS.crates.h, 12); ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, STATIONS.crates.x, STATIONS.crates.y, STATIONS.crates.w, 26, 12); ctx.fill();
    label('RAK BAHAN — tekan E untuk ambil', 776, STATIONS.crates.y + 19, 14, '#fff3d6', 'center');
    for (const crate of CRATES) {
      const cx = crate.x + 50;
      const cy = STATIONS.crates.y + 62;
      const near = station === 'crates' && state.chef && Math.abs(state.chef.x - (crate.x + 50)) < 70;
      ctx.fillStyle = near ? '#f6c453' : '#f7ead7';
      rr(ctx, crate.x, STATIONS.crates.y + 34, 100, 62, 10); ctx.fill();
      ctx.fillStyle = '#8a5a33';
      rr(ctx, crate.x, STATIONS.crates.y + 34, 100, 8, 4); ctx.fill();
      drawFood(crate.id, cx, cy - 4, 32);
      label(crate.label, cx, STATIONS.crates.y + 90, 11, PALETTE.charcoal, 'center');
    }
  }

  function drawBoard(state, station) {
    const r = STATIONS.board;
    const near = station === 'board';
    ctx.fillStyle = near ? '#f6c453' : PALETTE.counterTop;
    rr(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12); ctx.fill();
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.fillStyle = '#d9b078';
    rr(ctx, r.x + 24, r.y + 26, 150, 44, 8); ctx.fill();
    ctx.strokeStyle = '#a87a44'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(r.x + 24, r.y + 48); ctx.lineTo(r.x + 174, r.y + 48); ctx.stroke();
    label('PAPAN CINCANG', r.x + r.w / 2, r.y + 18, 13, '#fff3d6', 'center');
    if (state.chopping) {
      drawFood(state.chopping.item, r.x + 80, r.y + 48, 34);
      // Knife, bobbing with the chop.
      const bob = Math.sin(state.chef.chopAnim * 14) * 6;
      ctx.fillStyle = '#cfd6dd';
      ctx.save();
      ctx.translate(r.x + 140, r.y + 30 + bob);
      ctx.rotate(0.5);
      rr(ctx, -6, -16, 12, 32, 3); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#5a3a22';
      rr(ctx, r.x + 152, r.y + 8 + bob, 10, 14, 3); ctx.fill();
      // Progress bar.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, r.x + 24, r.y + 78, 182, 10, 5); ctx.fill();
      ctx.fillStyle = PALETTE.leaf;
      rr(ctx, r.x + 24, r.y + 78, 182 * Math.min(1, state.chopping.progress), 10, 5); ctx.fill();
    } else {
      drawFood('sayur', r.x + 70, r.y + 48, 30);
      drawFood('ayam', r.x + 130, r.y + 48, 30);
      text('Ayam / sayur / bawang', r.x + r.w / 2, r.y + 90, 11, '#ffd9a0', 'center');
    }
  }

  function drawWok(state, station, time) {
    const r = STATIONS.wok;
    const near = station === 'wok';
    ctx.fillStyle = near ? '#f6c453' : PALETTE.counterTop;
    rr(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12); ctx.fill();
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    label('WOK — API BESAR', r.x + r.w / 2, r.y + 18, 13, '#fff3d6', 'center');
    // Flame, flickering.
    const flick = 1 + Math.sin(time * 9) * 0.12 + Math.sin(time * 23) * 0.06;
    for (let i = 0; i < 5; i += 1) {
      const fx = r.x + 70 + i * 36;
      ctx.fillStyle = i % 2 ? PALETTE.flameOrange : PALETTE.flameYellow;
      ctx.beginPath();
      ctx.moveTo(fx - 13, r.y + 82);
      ctx.quadraticCurveTo(fx - 6, r.y + 44 * flick, fx, r.y + 52 * flick);
      ctx.quadraticCurveTo(fx + 6, r.y + 44 * flick, fx + 13, r.y + 82);
      ctx.closePath(); ctx.fill();
    }
    // Wok bowl.
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.arc(r.x + 150, r.y + 46, 52, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#565660';
    ctx.beginPath();
    ctx.arc(r.x + 150, r.y + 46, 44, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    // Items cooking inside.
    state.wok.forEach((item, i) => {
      const ix = r.x + 122 + i * 56;
      const iy = r.y + 44;
      if (item.burnt) {
        ctx.fillStyle = '#241a12';
        circle(ctx, ix, iy, 13); ctx.fill();
        ctx.fillStyle = '#555';
        circle(ctx, ix - 4, iy - 4, 3); ctx.fill();
      } else {
        drawFood(item.cooked ? item.result : item.item, ix, iy, 30);
      }
      if (!item.cooked) {
        const p = Math.min(1, item.time / 3.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ix, iy, 19, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
      } else if (!item.burnt) {
        ctx.fillStyle = '#7fbf5a';
        circle(ctx, ix + 14, iy - 14, 9); ctx.fill();
        ctx.fillStyle = '#fff';
        text('✓', ix + 14, iy - 10, 12, '#fff', 'center', 'bold');
        const left = 3.5 + 4 - item.time;
        text(`${Math.max(0, left).toFixed(0)}s`, ix, iy + 30, 11, '#ffd9a0', 'center', 'bold');
      } else {
        text('GOSONG!', ix, iy + 30, 11, '#ff8a7a', 'center', 'bold');
      }
    });
    if (state.wok.length === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      rr(ctx, r.x + 28, r.y + 82, r.w - 56, 16, 8); ctx.fill();
      text('Telur / mie / ayam cincang', r.x + r.w / 2, r.y + 94, 11, '#ffd9a0', 'center');
    }
  }

  function drawPlateStation(state, station) {
    const r = STATIONS.plate;
    const near = station === 'plate';
    const recipe = matchRecipe(state.plate);
    ctx.fillStyle = recipe ? '#f6c453' : near ? '#ffd970' : PALETTE.counterTop;
    rr(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12); ctx.fill();
    ctx.fillStyle = PALETTE.counter;
    rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    label('MEJA PLATING', r.x + r.w / 2, r.y + 18, 13, '#fff3d6', 'center');
    // The plate.
    ctx.fillStyle = '#fff8e7';
    ellipse(ctx, r.x + r.w / 2, r.y + 50, 82, 26); ctx.fill();
    ctx.fillStyle = '#e8d5a8';
    ellipse(ctx, r.x + r.w / 2, r.y + 50, 64, 19); ctx.fill();
    ctx.fillStyle = '#fff8e7';
    ellipse(ctx, r.x + r.w / 2, r.y + 48, 58, 16); ctx.fill();
    if (state.plate.length === 0) {
      text('Piring kosong', r.x + r.w / 2, r.y + 54, 12, '#a87a44', 'center');
    } else {
      state.plate.forEach((item, i) => {
        const px = r.x + 48 + i * 34;
        drawFood(item, px, r.y + 46 - (i % 2) * 6, 30);
      });
      if (recipe) {
        ctx.fillStyle = recipe.golden ? '#f6c453' : '#7fbf5a';
        rr(ctx, r.x + 34, r.y + 76, r.w - 68, 20, 10); ctx.fill();
        label(recipe.golden ? '✦ SIAP SAJI — TUMPENG EMAS! ✦' : `SIAP SAJI — ${recipe.name.toUpperCase()}`, r.x + r.w / 2, r.y + 91, 12, recipe.golden ? '#5a3a00' : '#fff', 'center');
      } else {
        text(plateHint(state.plate), r.x + r.w / 2, r.y + 90, 11, '#ffd9a0', 'center');
      }
    }
  }

  function drawTickets(state, time) {
    ctx.fillStyle = '#6a4423';
    rr(ctx, 16, 56, 256, 504, 14); ctx.fill();
    ctx.fillStyle = '#8a5a33';
    rr(ctx, 22, 62, 244, 492, 10); ctx.fill();
    label('PAPAN PESANAN', 144, 92, 19, '#f6c453', 'center');
    text('Sajikan sebelum waktunya habis!', 144, 112, 11, '#ffd9a0', 'center');
    const slots = state.orders.list;
    for (let i = 0; i < 3; i += 1) {
      const ty = 126 + i * 142;
      ctx.fillStyle = slots[i] ? PALETTE.ticket : 'rgba(247,234,215,0.25)';
      rr(ctx, 32, ty, 224, 130, 10); ctx.fill();
      if (!slots[i]) {
        text('— slot kosong —', 144, ty + 68, 13, '#e8d5a8', 'center');
        continue;
      }
      const order = slots[i];
      const recipe = order.recipe;
      const frac = Math.max(0, order.patience / order.maxPatience);
      const urgent = frac < 0.35;
      if (recipe.golden) {
        ctx.strokeStyle = '#f6c453'; ctx.lineWidth = 4;
        rr(ctx, 32, ty, 224, 130, 10); ctx.stroke();
      }
      if (urgent && Math.sin(time * 6) > 0) {
        ctx.fillStyle = 'rgba(176,42,48,0.12)';
        rr(ctx, 32, ty, 224, 130, 10); ctx.fill();
      }
      label(recipe.golden ? '✦ ' + recipe.short.toUpperCase() + ' ✦' : recipe.short.toUpperCase(), 144, ty + 24, 16, recipe.golden ? '#b07a00' : PALETTE.charcoal, 'center');
      recipe.needs.forEach((need, j) => {
        drawFood(need, 62 + j * 44, ty + 52, 32);
      });
      text(recipe.blurb, 144, ty + 84, 10, '#6a4a2e', 'center');
      // Patience bar.
      ctx.fillStyle = '#e0c9a0';
      rr(ctx, 44, ty + 96, 200, 10, 5); ctx.fill();
      ctx.fillStyle = frac > 0.5 ? PALETTE.leaf : frac > 0.25 ? PALETTE.amber : PALETTE.red;
      rr(ctx, 44, ty + 96, 200 * frac, 10, 5); ctx.fill();
      text(`${Math.ceil(order.patience)} dtk`, 44, ty + 124, 11, '#6a4a2e', 'left', 'bold');
      text(`${recipe.base} koin`, 244, ty + 124, 11, '#b07a00', 'right', 'bold');
    }
  }

  function drawChef(state, time) {
    const chef = state.chef;
    const bob = chef.moving && !state.chopping ? Math.sin(time * 12) * 3 : 0;
    const x = chef.x;
    const y = chef.y + bob;
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ellipse(ctx, x, chef.y + 34, 30, 8); ctx.fill();
    // Body + apron.
    ctx.fillStyle = '#fff8e7';
    rr(ctx, x - 22, y - 6, 44, 40, 14); ctx.fill();
    ctx.fillStyle = '#b02a30';
    rr(ctx, x - 22, y + 14, 44, 20, 10); ctx.fill();
    ctx.fillStyle = '#f6c453';
    ctx.fillRect(x - 22, y + 12, 44, 4);
    // Arms.
    ctx.fillStyle = '#f2c9a0';
    circle(ctx, x - 24, y + 8, 8); ctx.fill();
    circle(ctx, x + 24, y + 8, 8); ctx.fill();
    // Head.
    ctx.fillStyle = '#f2c9a0';
    circle(ctx, x, y - 18, 17); ctx.fill();
    // Golden toque.
    ctx.fillStyle = '#fff3c9';
    circle(ctx, x - 12, y - 34, 10); ctx.fill();
    circle(ctx, x, y - 40, 12); ctx.fill();
    circle(ctx, x + 12, y - 34, 10); ctx.fill();
    ctx.fillStyle = '#f6c453';
    rr(ctx, x - 17, y - 34, 34, 8, 4); ctx.fill();
    // Face.
    ctx.fillStyle = PALETTE.charcoal;
    circle(ctx, x - 6 + chef.dir * 2, y - 20, 2); ctx.fill();
    circle(ctx, x + 6 + chef.dir * 2, y - 20, 2); ctx.fill();
    ctx.strokeStyle = PALETTE.charcoal; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(x + chef.dir * 2, y - 13, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // Moustache.
    ctx.fillStyle = '#5a3a22';
    ellipse(ctx, x - 4, y - 11, 5, 2); ctx.fill();
    ellipse(ctx, x + 4, y - 11, 5, 2); ctx.fill();
    // Carried ingredients, in a little tray above the toque.
    if (state.hands.length > 0) {
      ctx.fillStyle = '#8a5a33';
      rr(ctx, x - 34, y - 74, 68, 12, 6); ctx.fill();
      state.hands.forEach((item, i) => {
        drawFood(item, x - 22 + i * 22, y - 66, 24);
      });
    }
    // Chop animation: knife above the chef.
    if (state.chopping) {
      const kb = Math.sin(state.chef.chopAnim * 14) * 8;
      ctx.fillStyle = '#cfd6dd';
      ctx.save();
      ctx.translate(x + 30, y - 30 + kb);
      ctx.rotate(0.6);
      rr(ctx, -5, -14, 10, 28, 3); ctx.fill();
      ctx.restore();
    }
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.fillStyle = PALETTE.gold;
    label('🍳 DAPUR EMAS', 24, 34, 24, PALETTE.gold, 'left');
    text('Golden Kitchen Rush', 262, 34, 14, PALETTE.cream, 'left');
    // Shift timer.
    const mm = Math.floor(state.remaining / 60);
    const ss = Math.floor(state.remaining % 60);
    const low = state.remaining <= 30;
    label(`⏱ ${mm}:${String(ss).padStart(2, '0')}`, 560, 34, 22, low ? '#ff8a7a' : '#fff', 'center');
    ctx.fillStyle = '#4a3a28';
    rr(ctx, 460, 42, 200, 6, 3); ctx.fill();
    ctx.fillStyle = low ? PALETTE.red : PALETTE.gold;
    rr(ctx, 460, 42, 200 * (state.remaining / 180), 6, 3); ctx.fill();
    // Score and coins.
    label(`SKOR ${state.score}`, 720, 34, 20, '#fff', 'left');
    text(`🪙 ${state.coins}`, 900, 34, 18, PALETTE.gold, 'left');
    text(`🍽 ${state.served} hidangan`, 1000, 34, 16, PALETTE.cream, 'left');
    // Combo badge.
    if (state.combo >= 2) {
      const pulse = 1 + Math.sin(Date.now() / 180) * 0.05;
      ctx.save();
      ctx.translate(1210, 26);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = state.elapsed < state.rushUntil ? '#ff9a2e' : PALETTE.gold;
      rr(ctx, -58, -18, 116, 36, 18); ctx.fill();
      label(`COMBO x${state.combo}`, 0, 7, 16, '#5a3a00', 'center');
      ctx.restore();
    } else {
      text('COMBO x0', 1210, 34, 15, '#a8906a', 'center');
    }
  }

  function drawSteam(state) {
    for (const puff of state.steam) {
      ctx.fillStyle = PALETTE.steam;
      circle(ctx, puff.x + Math.sin(puff.wobble) * 6, puff.y, puff.r); ctx.fill();
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      circle(ctx, p.x, p.y, p.size); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRushBanner(state) {
    if (!(state.elapsed < state.rushUntil)) return;
    const left = Math.max(0, state.rushUntil - state.elapsed);
    ctx.fillStyle = 'rgba(255,154,46,0.95)';
    rr(ctx, 440, 60, 400, 34, 17); ctx.fill();
    label(`⚡ RUSH EMAS — POIN GANDA! ${left.toFixed(0)} dtk ⚡`, 640, 84, 17, '#fff', 'center');
  }

  function drawServedPop(state) {
    const pop = state.servedPop;
    if (!pop) return;
    const alpha = Math.min(1, pop.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(43,33,24,0.85)';
    rr(ctx, 900, 300, 330, 64, 12); ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    label(pop.text, 1065, 330, 26, PALETTE.gold, 'center');
    text(`${pop.recipe} • Combo x${pop.combo}`, 1065, 354, 14, '#fff', 'center');
    ctx.globalAlpha = 1;
  }

  function drawHint(state) {
    if (state.elapsed > state.hintUntil || !state.hint) return;
    ctx.fillStyle = 'rgba(43,33,24,0.88)';
    const w = Math.min(760, 40 + state.hint.length * 8.5);
    rr(ctx, 776 - w / 2, 566, w, 26, 13); ctx.fill();
    text(state.hint, 776, 584, 14, '#fff3d6', 'center');
  }

  function drawPanel(title, lines, prompt) {
    ctx.fillStyle = 'rgba(20,14,8,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.ticket;
    rr(ctx, 340, 110, 600, 500, 18); ctx.fill();
    ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = 4;
    rr(ctx, 340, 110, 600, 500, 18); ctx.stroke();
    label(title, 640, 168, 34, PALETTE.charcoal, 'center');
    lines.forEach((line, i) => {
      text(line.text, 640, 214 + i * 30, line.size || 17, line.color || '#4a3a28', 'center');
    });
    if (prompt) {
      ctx.fillStyle = PALETTE.red;
      rr(ctx, 440, 540, 400, 44, 22); ctx.fill();
      label(prompt, 640, 569, 18, '#fff', 'center');
    }
  }

  function drawTitle(state, best) {
    drawKitchen(state, 0, true);
    drawPanel('🍳 DAPUR EMAS', [
      { text: 'Golden Kitchen Rush — dapur Indonesia yang hangat dan sibuk!', size: 18 },
      { text: 'Ambil bahan dari rak bawah, cincang di papan, masak di wok,', size: 17 },
      { text: 'rakit di meja plating, sajikan sebelum pesanan hangus.', size: 17 },
      { text: '', size: 12 },
      { text: 'Gerak: WASD / panah  •  Interaksi: E / Spasi / klik stasiun', size: 16, color: '#7a4a2e' },
      { text: 'Buang isi piring: X  •  Jeda: P', size: 16, color: '#7a4a2e' },
      { text: '', size: 12 },
      { text: 'Kombo 5x = RUSH EMAS: poin ganda 15 detik!', size: 17, color: '#b07a00' },
      { text: 'Awas Tumpeng Emas — pesanan langka bernilai 300 koin!', size: 17, color: '#b07a00' },
      { text: `Shift: 3 menit  •  Skor terbaik: ${best}`, size: 15, color: '#6a4a2e' },
    ], 'TEKAN SPASI / KLIK UNTUK MULAI');
  }

  function drawOver(state, best) {
    drawKitchen(state, 0, true);
    const lines = [
      { text: `SKOR ${state.score}`, size: 30, color: PALETTE.red },
      { text: '', size: 12 },
      { text: `Hidangan disajikan: ${state.served}`, size: 20 },
      { text: `Kombo terbaik: x${state.bestCombo}`, size: 20 },
      { text: `Koin terkumpul: ${state.coins}`, size: 20 },
      { text: '', size: 12 },
      { text: state.score >= best && state.score > 0 ? '🏆 Skor terbaik baru!' : `Skor terbaik: ${best}`, size: 18, color: '#b07a00' },
    ];
    drawPanel('⏰ SHIFT SELESAI!', lines, 'TEKAN SPASI UNTUK MASAK LAGI');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20,14,8,0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    label('JEDA — tekan P untuk lanjut', 640, 360, 30, '#fff', 'center');
  }

  function drawKitchen(state, time, still) {
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Left column background (order board + cat corner).
    ctx.fillStyle = '#e8cfa8';
    ctx.fillRect(0, 52, 280, 668);
    drawWall(time);
    drawFloor();
    drawCat();
    drawTickets(state, time);
    const station = state.nearestStation ? state.nearestStation() : null;
    drawBoard(state, station);
    drawWok(state, station, time);
    drawPlateStation(state, station);
    drawCrates(state, station);
    drawSteam(state);
    if (!still) drawChef(state, time);
    drawParticles(state);
    drawHud(state);
    drawRushBanner(state);
    drawServedPop(state);
    if (!still) drawHint(state);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(246,196,83,${state.flash * 0.5})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  function draw(state, screen, best, time) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.charcoal;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const t = time || 0;
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else {
      drawKitchen(state, t, false);
      if (screen === SCREEN_PAUSED) drawPaused();
    }
  }

  return { draw, drawFood, resize };
}
