# Graphics V2

Branch **`graphics-v2`**. `main` (the live GitHub Pages game) is untouched and nothing here is merged.
Rollback point for Phase 1: branch `graphics-v2-phase1-rollback`.

- **Phase 1**: foundation, audit, benchmark (changes nothing on screen).
- **Phase 2**: modern three.js (r186) with the legacy look preserved on every track, plus the first
  Graphics V2 look on **Pacifica Cliffs + GT40**: physically based lighting from a real sky, HDR post
  (MSAA, GTAO, bloom, haze, Neutral tone mapping, grade), a layered road with decals, GT40 materials,
  optimised assets and intentional dressing.

<img src="img/phase2/compare_medium.jpg" width="900">

- **Phase 3**: Mojave Mesa Run V2, the vehicle material-slot pipeline (six cars), the Meshy → Blender
  vegetation/prop pipeline, shader prewarm. Rollback point: commit `5cebd51` (Phase 3 + Ryden's Bus).
- **Phase 4**: Alondra Blvd V2, Revolution V2 (seven chapter looks), all 14 GLB cars on material slots
  (incl. Ryden's Bus V2), draw-call control for city blocks, KTX2 env variants, M4 benchmarks, the
  Neon Foundry audit. Ryden's Bus itself was released to `main` separately (commit `fa7c1a8`, Bus only).

- **Phase 5**: Neon Foundry V2 (wet midnight, HDR LEDs, night IBL, wet road, furnace glow, steam), Revolution
  Yorktown/mobile draw-call cleanup, the showroom on V2 (studio rig + slot materials), source slot fixes for six
  cars, the Phase 5 Meshy set. Rollback point: branch `graphics-v2-phase5-rollback`.

## Phase 5 documents

| Document | Contents |
|---|---|
| [26 · Neon Foundry V2](26-neon-v2.md) | Night look, lighting without lights, wet road, steam, rain decision, readability, bench |
| [27 · Vehicle fixes](27-vehicle-fixes.md) | Rotated cars, baked-in wheels, slot recipes, results per car |
| [28 · Showroom V2](28-showroom-v2.md) | Studio env, neutral rig, slot materials by default, platform sizing |
| [29 · Revolution performance](29-revolution-perf.md) | Yorktown draw breakdown, merges, before/after |
| [30 · Benchmarks: status and kit](30-phase5-benchmarks.md) | What was (not) measured on hardware, the URLs to run |
| [31 · Phase 5 report](31-phase5-report.md) | Deliverables, known issues, Phase 6 recommendation |

## Phase 4 documents

| Document | Contents |
|---|---|
| [19 · Alondra V2](19-alondra-v2.md) | Smoggy SoCal afternoon, the black-wall bug, city materials, wall art, street life (BPD lot, traffic stop), merge by material |
| [20 · Phase 4 assets](20-phase4-assets.md) | New props, env variants, car variants, density per preset |
| [21 · Revolution V2](21-revolution-v2.md) | Chapter looks on the course's chapter system, Delaware not blue, battlefield, troops, bench |
| [22 · Vehicles (Phase 4)](22-vehicles-phase4.md) | Eight more cars on slots, per-car finishes, Bus V2, geometry parity, showroom test |
| [23 · Neon Foundry audit](23-neon-foundry-audit.md) | What a Phase 5 night look needs (no changes made) |
| [24 · Phase 4 performance](24-phase4-performance.md) | Phase 3 vs Phase 4 on the M4, Alondra legacy vs V2, what was not measured |
| [25 · Phase 4 report and Phase 5 recommendation](25-phase4-report.md) | Deliverables, known issues, what next |
| Benchmark data | `phase4_bench/` (`m4_runs.jsonl`: every M4 run; `baseline_*.json`: the 4A baseline) |

## Phase 3 documents

| Document | Contents |
|---|---|
| [16 · Mojave V2](16-mojave-v2.md) | High desert noon, terrain/rock, bleached road, storytelling dressing |
| [17 · Vehicle pipeline](17-vehicle-pipeline.md) | Material slots from Blender, folding, parity |
| [18 · Vegetation and props](18-vegetation-props.md) | Meshy → Blender prop pipeline, dressing vs scatter, asset table |

## Phase 2 documents

| Document | Contents |
|---|---|
| [07 · three.js migration report](07-phase2-threejs-migration-report.md) | r128 → r186: API changes, compat layer, shader changes, parity results, remaining debt |
| [09 · Pacifica V2](09-pacifica-v2.md) | What changed visually on the benchmark track |
| [10 · GT40 materials](10-gt40-materials.md) | Paint, clear coat, glass, tyres, metal, reflections; the reusable vehicle material system |
| [11 · Road upgrade](11-road-upgrade.md) | Asphalt layers, rubber line, edge wear, paint, decals, shoulder transition |
| [12 · Post-processing](12-post-processing.md) | Effects, tier switches, cost |
| [13 · Performance](13-performance.md) | BEFORE vs AFTER workload, tier workloads, real-device numbers and how to get more |
| [08 · Asset optimization](08-asset-optimization.md) | KTX2/Meshopt, the Meshy → Blender → game pipeline, what every Meshy asset still needs |
| [14 · Known issues](14-known-issues.md) | Everything that is not right yet |
| [15 · Phase 3 recommendation](15-phase3-recommendations.md) | What to do next, in order |
| Screenshots | `img/phase2/`: OLD vs V2 (`compare_medium.jpg`, `old_*.jpg` / `v2_*.jpg`), tiers (`tiers.jpg`), r128 vs r186 parity (`parity_r128_r186.jpg`) |
| Benchmark data | `phase2_bench/*.json` |

## Phase 1 documents

| Document | Contents |
|---|---|
| [01 · Asset inventory](01-asset-inventory.md) | Every GLB in the game plus the 32 Meshy models ([`models/catalog.json`](../../models/catalog.json)) |
| [02 · Rendering audit](02-rendering-audit.md) | The renderer as it was, bottlenecks, technical debt |
| [03 · Architecture](03-architecture.md) | The `js/gfx/*` modules and the rules for graphics code |
| [04 · Benchmark](04-benchmark.md) | Pacifica + GT40 benchmark: shots, metrics, Phase 1 baseline |
| [05 · three.js migration plan](05-threejs-migration-plan.md) | The plan Phase 2 followed |
| [06 · Phase 2 recommendations](06-phase2-recommendations.md) | The plan for Phase 2 |

## Developer switches (nothing is visible to players)

| Switch | Effect |
|---|---|
| `?gfxdebug=1`, or press **`` ` ``** | Performance overlay: FPS, frame time, p95, 1 % low, CPU submit, draws, triangles, textures, programs, materials, texture memory, lights, shadow casters, V2 look / post stages / culling, backend, three.js revision, GPU, resolution, pixel ratio, tier |
| **`\`** (with the overlay open) | Reload with the other pipeline (OLD ↔ GRAPHICS V2), keeping the other switches |
| `?bench=pacifica` | The benchmark. The results panel shows OLD and V2 side by side once both have run on the device |
| `?gfx=legacy` / `?gfx=v2` | OLD (Phase 1 look on r186) / Graphics V2 (default on this branch) |
| `?three=r128` | The original three.js r128 renderer (also used automatically on devices without WebGL2) |
| `?tier=low\|medium\|high\|ultra` | Force a tier (Ultra is also in the Settings menu now) |
| `?post=off\|noao\|nobloom\|nohaze\|nograde` | Switch off one post stage to A/B it |
| `?mobile=1` / `?mobile=0` | Force the phone variant of the V2 tiers on or off |
| `?drs=1` / `?drs=0` | Force dynamic resolution on or off |
| `?origassets` | Load the original environment GLB instead of the KTX2/Meshopt variant |
| `?frames=N` | Shorter benchmark runs |
| `?bench=mojave` / `alondra` / `revolution` / `neon` | Phase 3–5 benchmark scenes (Revolution needs a signed-in account) |
| `&car=<id>` | Benchmark with another car |
| `?nodetail=1` | Switch the V2 detail shaders off (A/B) |
| `?merge=0` | Switch off draw-call merging (flat-colour merge and merge by material) |
| `?showroomv2=0` | Old showroom rig and single-material cars on V2 (comparison; V2 showroom is the default since Phase 5, see 28) |
| `?prewarm=0` | Skip the shader/texture prewarm before the race |

## Code map (Phase 2)

| File | What it does |
|---|---|
| `js/vendor/three.r186.min.js` | three.js r186 + addons (GLTF, KTX2, Meshopt, GTAO, LUT…), built from `tools/three-bundle-entry.js` |
| `js/gfx/compat.js` | Every r128 ↔ r186 difference (colour spaces, light units, shadows, UV varyings, legacy PMREM/UV parity) |
| `js/gfx/settings.js` | Tiers Low/Medium/High/Ultra with V2 and phone variants |
| `js/gfx/renderer.js` | The one render entry point: direct or post path, per-pass counters, dynamic resolution |
| `js/gfx/post.js` | HDR post pipeline |
| `js/gfx/sky.js` | Sky, IBL and ocean (one shared sky function) |
| `js/gfx/v2.js` | Track looks (Pacifica) and the V2 lifecycle (begin / finish / end), dressing |
| `js/gfx/road.js`, `decals.js` | Road layers and decals |
| `js/gfx/vehicles.js` | Vehicle material profiles |
| `js/gfx/lod.js` | Chunking, zones, distance culling, LOD |
| `tools/optimize_env.sh`, `prop_lod.mjs`, `car_matid.py` | Asset pipeline |
