# Graphics V2 · Phase 1

Branch **`graphics-v2`**. `main` (the live GitHub Pages game) is untouched. Phase 1 builds the
foundation and **changes nothing on screen**: the same draw calls and triangles on every track tested,
and a pixel-identical frame on Pacifica, compared with `main`.

| Document | Contents |
|---|---|
| [01 · Asset inventory](01-asset-inventory.md) | Every GLB in the game plus the 32 new Meshy models, classified by category and track (data: [`models/catalog.json`](../../models/catalog.json)) |
| [02 · Rendering audit](02-rendering-audit.md) | What renders the game today, the visual bottlenecks ranked, performance bottlenecks, technical debt |
| [03 · Architecture](03-architecture.md) | The new `js/gfx/*` modules and the rules for Phase 2 code |
| [04 · Benchmark](04-benchmark.md) | Pacifica + GT40 benchmark: shots, metrics, how to compare OLD vs V2 |
| [05 · three.js migration plan](05-threejs-migration-plan.md) | r128 → modern three.js: what changes and in what order |
| [06 · Phase 2 recommendations](06-phase2-recommendations.md) | The next graphics changes, in order |

## Developer switches (nothing is visible to players)

| Switch | Effect |
|---|---|
| `?gfxdebug=1`, or press **`` ` ``** (backquote/tilde) | Performance overlay: FPS, frame time, p95, 1% low, CPU submit time, draw calls, triangles, geometries, textures, programs, materials and texture memory, backend, three.js revision, GPU, resolution, pixel ratio, tier, pipeline, track. Remembered on the device. `GFX.perf.toggle()` in the console |
| `?bench=pacifica` | Runs the benchmark (see 04) |
| `?tier=low|medium|high|ultra` | Forces a tier for this visit (`ultra` is developer-only) |
| `?gfx=legacy|v2` | Pipeline flag for OLD vs V2 comparisons (identical in Phase 1) |

## What changed in the code

- `js/vendor/GLTFLoader.r128.js`: the glTF loader, moved verbatim out of `game.js` (which drops from
  7,368 to about 3,700 lines of actual game code).
- `js/gfx/settings.js`, `renderer.js`, `lighting.js`, `environment.js`, `materials.js`, `assets.js`,
  `perf.js`, `benchmark.js`: see [03](03-architecture.md).
- `js/game.js`: the renderer, quality table, lights, sky, fog, render calls and sun follow now go through
  `GFX.*`. No gameplay code changed (physics, AI, laps, items, UI, audio, online, unlocks).
- `models/catalog.json` + `tools/`: asset inventory and the scripts that build it.
- `models/env/env_revolution.glb`: now the correct new Revolution environment (it had been uploaded to
  `models 2/env/` on `main`).
