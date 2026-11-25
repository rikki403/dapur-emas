// Every ingredient the kitchen stocks: what it is called, what the board and
// the wok do to it, and the colours its drawn icon uses.
export const INGREDIENTS = {
  nasi: { name: 'Nasi', chop: null, cook: null, color: '#fff6e0', color2: '#e8d5a8' },
  telur: { name: 'Telur', chop: null, cook: 'telur-goreng', color: '#fff3d6', color2: '#f2b544' },
  'telur-goreng': { name: 'Telur Goreng', chop: null, cook: null, color: '#ffe9a8', color2: '#f2a93b' },
  mie: { name: 'Mie', chop: null, cook: 'mie-goreng', color: '#f7d774', color2: '#d9a83c' },
  'mie-goreng': { name: 'Mie Goreng', chop: null, cook: null, color: '#e8b64a', color2: '#a8642a' },
  ayam: { name: 'Ayam', chop: 'ayam-cincang', cook: null, color: '#f2b8a0', color2: '#c96a4a' },
  'ayam-cincang': { name: 'Ayam Cincang', chop: null, cook: 'ayam-panggang', color: '#e89a7a', color2: '#b85a3a' },
  'ayam-panggang': { name: 'Ayam Panggang', chop: null, cook: null, color: '#c97a3a', color2: '#7e3f16' },
  sayur: { name: 'Sayur', chop: 'sayur-cincang', cook: null, color: '#7fbf5a', color2: '#3e7a2e' },
  'sayur-cincang': { name: 'Sayur Cincang', chop: null, cook: null, color: '#5da244', color2: '#2f5c22' },
  bawang: { name: 'Bawang', chop: 'bawang-cincang', cook: null, color: '#e8c8e0', color2: '#a86a9a' },
  'bawang-cincang': { name: 'Bawang Cincang', chop: null, cook: null, color: '#d9a8cc', color2: '#8a4a7a' },
  kecap: { name: 'Kecap', chop: null, cook: null, color: '#5a2e18', color2: '#2e1408' },
  bumbu: { name: 'Bumbu Kacang', chop: null, cook: null, color: '#c98a3a', color2: '#7a4a16' },
  tusuk: { name: 'Tusuk Sate', chop: null, cook: null, color: '#d9b078', color2: '#8a6a3a' },
};

/** The crate the chef picks an ingredient from: one crate, one ingredient. */
export function cratePick(crateId) {
  return crateId;
}

export function ingredientName(id) {
  return (INGREDIENTS[id] && INGREDIENTS[id].name) || id;
}

export function chopResult(id) {
  return (INGREDIENTS[id] && INGREDIENTS[id].chop) || null;
}

export function cookResult(id) {
  return (INGREDIENTS[id] && INGREDIENTS[id].cook) || null;
}
