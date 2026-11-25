// The recipes: what a plate must hold to become each dish, what it pays,
// and how long the kitchen gives you to serve it.
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng Emas',
    short: 'Nasi Goreng',
    needs: ['nasi', 'telur-goreng', 'bawang-cincang', 'kecap'],
    base: 120,
    golden: false,
    blurb: 'Nasi + telur goreng + bawang cincang + kecap',
  },
  {
    id: 'mie-goreng',
    name: 'Mie Goreng',
    short: 'Mie Goreng',
    needs: ['mie-goreng', 'sayur-cincang', 'ayam-panggang'],
    base: 140,
    golden: false,
    blurb: 'Mie goreng + sayur cincang + ayam panggang',
  },
  {
    id: 'sate-ayam',
    name: 'Sate Ayam',
    short: 'Sate Ayam',
    needs: ['ayam-panggang', 'bumbu', 'tusuk'],
    base: 150,
    golden: false,
    blurb: 'Ayam panggang + bumbu kacang + tusuk',
  },
  {
    id: 'tumpeng-emas',
    name: 'Nasi Tumpeng Emas',
    short: 'Tumpeng Emas',
    needs: ['nasi', 'telur-goreng', 'ayam-panggang', 'bawang-cincang', 'kecap'],
    base: 300,
    golden: true,
    blurb: 'Nasi + telur + ayam + bawang + kecap',
  },
];

export function recipeById(id) {
  for (const recipe of RECIPES) if (recipe.id === id) return recipe;
  return null;
}

/** The recipe a plate exactly matches, or null. Order of items does not matter. */
export function matchRecipe(plate) {
  for (const recipe of RECIPES) {
    if (plate.length !== recipe.needs.length) continue;
    const rest = plate.slice();
    let ok = true;
    for (const need of recipe.needs) {
      const at = rest.indexOf(need);
      if (at === -1) { ok = false; break; }
      rest.splice(at, 1);
    }
    if (ok) return recipe;
  }
  return null;
}

/** True when the plate holds only ingredients that belong to one recipe. */
export function plateHint(plate) {
  if (plate.length === 0) return 'Piring kosong — taruh bahan di sini';
  for (const recipe of RECIPES) {
    const rest = plate.slice();
    let ok = true;
    for (const item of plate) {
      const at = recipe.needs.indexOf(item);
      if (at === -1 || rest.filter((x) => x === item).length > recipe.needs.filter((x) => x === item).length) { ok = false; break; }
      rest.splice(rest.indexOf(item), 1);
    }
    if (ok) return `Menuju ${recipe.name} — ${recipe.needs.length - plate.length} bahan lagi`;
  }
  return 'Bahan ini tidak cocok — tekan X untuk buang';
}
