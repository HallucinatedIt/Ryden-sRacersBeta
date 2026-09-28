# Phase 2 recommendations (in order)

Ordered by visual gain per unit of GPU cost and risk, with the work that unblocks later steps first.
Every item is measured with `?bench=pacifica` on Low, Medium and High before it is accepted.

## 0. Housekeeping (before any visual work)
- **Fix the live Revolution environment on `main`** (the new `env_revolution.glb` was uploaded into
  `models 2/env/` by accident, so the site still loads the old environment). This is already fixed on
  `graphics-v2`.
- **Get real numbers:** run the benchmark on your Mac and on the phone you race on (Low and Medium) and
  commit the JSON files next to the cloud baseline. Mobile budgets are set from these numbers, not guessed.

## 1. Modern three.js (parity mode)
Follow `05-threejs-migration-plan.md` steps 1–2: module boot, colour-space renames, legacy-matching
lights, shader chunk fixes, with `ColorManagement` off. The target is an identical picture with a
modern core. Doing this first means post processing, IBL and new materials are written once, against
the API they will live on.

## 2. Image-based lighting for the world (biggest cheap win)
One PMREM sky probe per track (per chapter on Revolution) as `scene.environment`, with
`envMapIntensity` tuned per material class (road, rock, foliage, metal, water). Cost: one texture and a
little shader work; **no extra draw calls**. Gated by `settings.envLighting` (on from Medium).

## 3. Pacifica material pass (the benchmark becomes the showcase)
- Cliff and rock: triplanar-style detail with a normal map and a macro variation layer (the
  Revolution ground shader is a working start), so the cliff stops reading as one stretched texture.
- Road: an asphalt set (albedo, normal, roughness), aggregate detail, crack/patch **decals**, rubbered-in
  racing line, soft transition into shoulder and gravel.
- Sand, dry grass and headland ground blending by slope and height.

This needs a small Blender-pipeline change: export tangents and normal maps for environment surfaces.

## 4. Post-processing stack (High / Ultra first, then Medium)
Tone-mapping output pass, **SMAA** (all tiers when the pixel ratio is below 1), selective **bloom** (sun,
neon, lanterns, portals), a per-track **colour grade** (LUT), vignette, and later **GTAO** ambient
occlusion on Ultra. One composer, owned by `GFX.renderer`; every pass switchable per tier.

## 5. Grounding and shadows
Two-level shadows (a crisp near box and a soft far one), tighter per-tier `shadowDistance`, baked vertex
AO or AO maps from Blender for environment meshes, and blob/contact shadows for small props on Low.

## 6. Game-ready Meshy asset pipeline + intentional dressing
- A Blender script (`meshy_inbox.blend` → `models/library/<id>.glb`) that scales each model to its real
  height (`heightM` in the catalog), decimates to `targetTris`, bakes and caps textures (1024/2048,
  later KTX2), builds LOD1/LOD2 (and card impostors for trees), and writes the catalog entry.
- Per-track dressing **lists as data** (position, rotation, LOD, shadow flag), placed by the
  AssetManager, not random scatter. Start with Pacifica: palms and heather along the cliff road, red-hot
  poker planting at the overlooks, picnic tables and trash cans at the lookout, the Grand Sport on show
  in the festival paddock. Around 20 deliberate placements before anything else.
- Then Mojave (adobe pueblo, ibex on the rocks, ice freezer, generator, rat rod at the gas stop),
  Alondra/Sweet (ATM, AC units, graffiti walls, iron fences, dumpsters, parked sedan and panel truck),
  and Revolution (brick houses, market stall, timber gate, mossy logs, ferns, charred stumps).

## 7. Vegetation system
Instanced vegetation with 2–3 LODs and impostors, a shared wind shader (lifted from Revolution),
density from `settings.vegDensity`, and distance culling for every track (today only Revolution has it).

## 8. Sky and atmosphere
Clouds on every daytime track (the sky shader already supports them), height fog and aerial perspective,
sun glare, and per-track time-of-day presets.

## 9. Delivery and mobile
- **Meshopt geometry and KTX2 textures** for environment GLBs (105 MB → roughly half), on-demand loading
  for cars (today all 20 MB load at boot).
- **Dynamic resolution** on mobile, driven by `GFX.perf` (hold 60 fps by moving `renderScale` between
  0.7 and 1.0).
- A first-run **tier suggestion** from `GFX.settings.recommended()`, applied only once benchmark data
  confirms it.

## 10. Later
Reflections (screen-space or probes for wet Neon streets), local lights with a budget (`localLights`),
and then WebGPU/TSL, if the benchmark shows it pays off.
