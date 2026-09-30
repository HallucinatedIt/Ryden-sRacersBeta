# Ryden's Racers

A 3D arcade racer that runs in the browser.

Have fun plops

## Graphics V2 (branch `graphics-v2`)
Graphics modernization work lives in `js/gfx/` and is documented in [`docs/graphics-v2/`](docs/graphics-v2/README.md):
asset inventory (`models/catalog.json`), rendering audit, architecture, the Pacifica + GT40 benchmark (`?bench=pacifica`),
the developer performance overlay (`?gfxdebug=1` or the backquote key), the three.js migration plan and Phase 2 plan.
**Phase 2:** the game runs on three.js r186 (WebGL2; r128 remains the fallback). Pacifica Cliffs has the first Graphics V2 look
(physical sky lighting, HDR post-processing, layered road and decals, GT40 materials, KTX2/Meshopt assets). Every other track keeps
its legacy look. Compare with `?gfx=legacy`, or press `\` with the overlay open. Reports: `docs/graphics-v2/07`–`15`.
