// Tiny WebAudio bleeps, made on the fly — no sound files, no network.
// Everything is guarded: no audio context until the player first interacts.
let context = null;

function ensure() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    return null;
  }
  return context;
}

function blip(freq, seconds, type, gainValue, when) {
  const ctx = ensure();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const start = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export function playPickup() { blip(520, 0.12, 'triangle', 0.1); }
export function playChop() { blip(180, 0.08, 'square', 0.07); blip(140, 0.08, 'square', 0.06, 0.09); }
export function playCookDone() { blip(660, 0.15, 'sine', 0.1); blip(880, 0.2, 'sine', 0.1, 0.12); }
export function playServe() {
  blip(523, 0.12, 'triangle', 0.12);
  blip(659, 0.12, 'triangle', 0.12, 0.1);
  blip(784, 0.22, 'triangle', 0.14, 0.2);
}
export function playRush() {
  blip(392, 0.12, 'sawtooth', 0.08);
  blip(523, 0.12, 'sawtooth', 0.08, 0.1);
  blip(659, 0.12, 'sawtooth', 0.08, 0.2);
  blip(1046, 0.3, 'triangle', 0.12, 0.3);
}
export function playBurnt() { blip(220, 0.25, 'sawtooth', 0.09); blip(160, 0.3, 'sawtooth', 0.08, 0.12); }
export function playExpired() { blip(330, 0.2, 'sine', 0.09); blip(247, 0.3, 'sine', 0.09, 0.15); }
export function playClick() { blip(700, 0.06, 'triangle', 0.07); }
