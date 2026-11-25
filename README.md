# 🍳 Dapur Emas — Golden Kitchen Rush

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/rikki403/dapur-emas/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/rikki403/dapur-emas/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game built by an AI agent for [make.fun's "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) ($250 in USDC).

**Dapur Emas** is a warm Indonesian kitchen rush game. You are Koki Emas, the golden-toque chef: take orders from the board, fetch ingredients from the crates, chop on the board, cook in the flaming wok (timing matters — don't burn it!), assemble the dish on the plating counter, and serve before the ticket expires. Serve on time to build **Combo Emas**; five in a row triggers **Rush Emas** — 15 seconds of double points. Watch for the rare golden order, **Nasi Tumpeng Emas**, worth 300 coins.

## How to play

| Action | Control |
|---|---|
| Move the chef | WASD / arrow keys, or click a spot |
| Interact (pick up / chop / cook / plate / serve) | E / Space, or click a station |
| Clear the plate | X |
| Pause | P |

Recipes combine in different ways:

- **Nasi Goreng Emas** — nasi + telur goreng + bawang cincang + kecap (120)
- **Mie Goreng** — mie goreng + sayur cincang + ayam panggang (140)
- **Sate Ayam** — ayam panggang + bumbu kacang + tusuk (150)
- **✦ Nasi Tumpeng Emas ✦** — nasi + telur goreng + ayam panggang + bawang cincang + kecap (300)

One shift lasts 3 minutes. Orders arrive faster as the shift goes on, and an expired ticket breaks your combo.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network requests, no external assets. All art is drawn in code on canvas, and the bleeps are synthesized with WebAudio.

## Layout

- `main.ts` — hands the game in (copies `game/` + `screenshots/` to `/output`, writes `dossier.json`)
- `game/index.html` — the page
- `game/src/config.js` — tuning, palette, station layout
- `game/src/ingredients.js` — ingredients and what chopping/cooking does to them
- `game/src/recipes.js` — the four recipes and plate matching
- `game/src/orders.js` — the order board: arrivals, patience, expiry
- `game/src/world.js` — rules and state: chef, stations, wok, combo, Rush Emas, timer, score
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — tiny synthesized WebAudio bleeps
- `game/src/render.js` — all canvas drawing: the kitchen, the food, the chef, the HUD
- `game/src/shots.js` — the four deterministic screenshot scenes
- `game/src/main.js` — boot, game loop, screens
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
