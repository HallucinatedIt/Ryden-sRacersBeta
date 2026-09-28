# Graphics V2 architecture (Phase 1 foundation)

Goal: future graphics work lands in small, named modules instead of growing `game.js`. Phase 1 moves
the renderer-facing code out of the game file **without changing what is drawn** (verified: identical
draw calls/triangles on every track tested, pixel-identical frame on Pacifica), and adds the hooks that
Phase 2 features plug into.

## Load order (`index.html`)

```
three.min.js (r128, CDN)
js/vendor/GLTFLoader.r128.js   - the glTF loader, verbatim (was lines 1-3630 of game.js)
js/gfx/settings.js             - GraphicsSettings (tiers)
js/gfx/renderer.js             - RendererManager
js/gfx/lighting.js             - LightingManager
js/gfx/environment.js          - EnvironmentManager (+ makeSky, makeEnvFromTheme)
js/gfx/materials.js            - MaterialManager (+ glbAniso)
js/gfx/assets.js               - AssetManager (catalog)
js/gfx/perf.js                 - PerformanceMonitor + developer overlay
js/gfx/benchmark.js            - Pacifica + GT40 benchmark
js/game.js                     - the game (tracks, physics, AI, UI, audio, online, world builders)
```

Everything hangs off one global, `window.GFX`. Classic scripts, no build step, relative paths: GitHub
Pages deployment is unchanged.

## Modules

| Module | Owns | Used by game.js as | Phase 2 extension point |
|---|---|---|---|
| `GFX.settings` | The tier table: legacy fields (`pr, shadows, shadowSize, terrainCell, density, fogMul`, unchanged values) + V2 knobs (`renderScale, shadowDistance, shadowCasters, postFX, bloom, colorGrade, ssao, reflections, envLighting, vegDensity, propDensity, lodBias, particles, textureMax, anisotropy, localLights, decals`). Tiers: low / medium / high (menu) + ultra (developer). `pipeline`: `legacy` or `v2`. | `QUALITY = GFX.settings.legacyQuality()`, `Game.Q` resolves the saved tier (with `?tier=` override) | New systems read `GFX.settings.current().<knob>`; `recommended()` gives a device-based tier suggestion (not applied yet) |
| `GFX.renderer` | `WebGLRenderer` creation and config (sRGB, ACES, PCF soft), pixel ratio, resize, **the single `render()` call**, before/after hooks, capability report | `this.renderer = GFX.renderer.create(canvas)`; `applyQuality` / `resize` / `Race.render` / `Garage.render` delegate | Post-processing replaces the direct `r.render()` in one place; dynamic resolution via `renderScale`; three.js upgrade changes colour-space setup here only |
| `GFX.lighting` | Sun + hemisphere + shadow box; the per-frame shadow follow | `buildWorld` → `createWorldLights(W, th, Q)`; `Race.update` → `follow(W, x, y, z)` | `shadowDistance` per tier, cascades/stable shadows, local-light budget |
| `GFX.environment` | Sky dome (`makeSky`, with optional clouds), fog, sky-probe env map (`makeEnvFromTheme`), world IBL switch | `makeSky`, `makeFog`, `applyWorldIBL(scene, env, Q)` (returns false: off in Phase 1) | Turn on `envLighting`; consolidate the neon and showroom PMREMs here |
| `GFX.materials` | Texture filtering policy (`glbAniso`), material/texture accounting (`stats`) | `glbAniso()` global unchanged | Texture caps per tier, KTX2, shared material library for new assets |
| `GFX.assets` | Read-only asset inventory (`models/catalog.json`) + what is loaded | Not used by gameplay (developer/Phase 2) | Data-driven per-track dressing lists |
| `GFX.perf` | Frame timing, renderer counters, the hidden overlay | Hooked into `GFX.renderer.render` | Dynamic-resolution controller, auto tier drop |
| `GFX.bench` | Repeatable benchmark scene(s) | `?bench=pacifica` at boot | Add scenes per track; CI-style comparisons |

## What did *not* move (on purpose)

- **Track-specific rendering stays with its track** (Neon materials and light show, Pacifica ocean,
  Revolution runtime). These are tightly bound to their track data, and moving them in Phase 1 would risk
  the unique looks the brief asks to preserve. They now consume shared services (lighting, sky, fog,
  settings) and can migrate into `js/gfx/tracks/<id>.js` one at a time in Phase 2.
- **World builders** (`buildWorld`, scenery, env loading) still live in `game.js`: they also produce
  collision obstacles, so they are gameplay-relevant.
- **Physics, AI, laps, UI, audio, online** are untouched.

## Rules for Phase 2 code

1. New visual features read a knob from `GFX.settings.current()`, never `S.quality` directly.
2. Nothing but `GFX.renderer` calls `renderer.render()`.
3. Features that cost GPU time must be switchable per tier and visible in the overlay (draws/tris/ms).
4. Every change is checked with the benchmark (`?bench=pacifica`) on Low (mobile), Medium and High, and
   OLD vs V2 (`&gfx=legacy` / `&gfx=v2`).
5. Track identity first: shared systems provide defaults; tracks override (Neon stays neon, the
   Revolution chapters keep their atmosphere).
