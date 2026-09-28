# Graphics benchmark: Pacifica Cliffs + GT40

Pacifica works as the daylight benchmark: one short stretch has every surface type the Graphics V2 work
will touch. No other track beats it for a first benchmark (Revolution is heavier but its chapters
change the lighting constantly; Neon is a night scene with its own shaders), so the choice from the brief
stands.

## Running it

| URL | What it does |
|---|---|
| `index.html?bench=pacifica` | Runs the benchmark on your saved tier and the legacy pipeline |
| `…&tier=low` / `medium` / `high` / `ultra` | Forces a tier for this run (does not change your saved setting) |
| `…&gfx=legacy` / `&gfx=v2` | OLD vs GRAPHICS V2 pipeline (identical in Phase 1) |
| `…&gfxdebug=1` | Shows the performance overlay while it runs |

It loads Pacifica in practice mode with only the GT40. **No physics or AI runs**: the car is posed and
the camera placed by data, so every run draws the same frames. It takes about 25 s on a real GPU. At
the end a panel shows the results, compares them with your last run on the *other* pipeline at the same
tier (kept on the device), and offers the JSON and screenshots for download.

## Shots (data in `js/gfx/benchmark.js`, `BENCH_SCENES.pacifica`)

| id | What it's framing | Why |
|---|---|---|
| `cliff_lighthouse` | Chase camera, sample 330, heading for the lighthouse | Cliff face, ocean, guardrail, curbs, lighthouse and headland at distance |
| `lighthouse_wide` | Elevated side view of the lighthouse bend, sample 352 | Long-distance scenery, water, road paint, vegetation on the point |
| `tunnel_mouth` | Tunnel approach, sample 214 | Rock material, tunnel portal, shadow transition |
| `ocean_low` | Low side view of the car against the sea, sample 150 | Car paint and reflections against sea and sky, guardrail close-up |
| `festival_finish` | Chase camera at the beach-festival finish, sample 846 | Architecture, gantry, crowd, palms, billboards, low sun (the most draw calls) |
| `lighthouse_run` | Moving chase camera, samples 280 → 400 | Motion: streaming shadows, culling, animated water |

Each shot: 30 warm-up frames, then 180 measured frames. Recorded per shot:

- FPS (average), frame time average / p95 / worst, and 1% low
- CPU time to submit the render
- draw calls, triangles, geometries, textures, shader programs
- unique materials, textures and estimated texture memory
- a screenshot

Each run also records the device (backend, three.js revision, GPU string, drawing-buffer size, pixel
ratio), tier and pipeline.

## Baseline (Phase 1, legacy pipeline, Medium)

Captured in the cloud test harness (software GPU, 960×540). **Use the draw-call, triangle and texture
figures as the baseline. The FPS figures are not meaningful on a software GPU:** re-run on your Mac and a
phone to get real frame times.

See `bench_baseline_medium_legacy.json` in this folder and the screenshots in `img/bench/`.

## Using it for Phase 2

1. Before a change: run on Low (phone), Medium and High and keep the JSON files.
2. Build the change behind `GFX.settings.pipeline === 'v2'` (or a tier knob).
3. Run `&gfx=v2`; the panel shows V2 next to your last legacy run.
4. A change is accepted when it looks better in the screenshots **and** stays inside the budget for its
   tier (for example: Low holds 60 fps on the target phone; draw calls do not grow by more than 20%).
