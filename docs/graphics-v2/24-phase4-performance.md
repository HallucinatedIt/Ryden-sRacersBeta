# Phase 4H · Performance: Phase 3 vs Phase 4 (all runs, no cherry-picking)

## Method

- **Device:** Apple M4 (ANGLE Metal), the Claude browser pane in the desktop app, **487×671 drawing buffer**
  (the pane was narrower than for the Phase 4A baseline, 982×671, so those baseline files are *not* used
  for this comparison: both Phase 3 and Phase 4 were re-run here at the same size, back to back).
- **Builds:** Phase 3 = `5cebd51` (the rollback point, Phase 3 + Bus), Phase 4 = `403134c`, loaded from
  raw.githack at the pinned commit. Game muted.
- **Benchmark:** `?bench=<scene>&tier=medium`: 30 warm-up + 180 measured frames per shot, screenshot after
  the measured frames. One run per configuration; every run that completed is listed (`phase4_bench/m4_runs.jsonl`).
- **Caveat:** the display is 60 Hz with vsync, so every configuration shows 60 fps and ~16.7 ms average.
  The informative columns are **p95**, **1 % low**, **worst frame** and **CPU submit** (JS time per frame
  spent issuing the frame).

## Results (M4, Medium)

| scene · shot | Phase 3 p95 / 1 % low / worst / CPU | Phase 4 p95 / 1 % low / worst / CPU | draws P3 → P4 |
|---|---|---|---|
| Pacifica · cliff_lighthouse | 18.2 / 47.4 / **29.0** / 2.21 | 18.1 / 53.2 / 18.9 / 2.42 | 91 → 91 |
| Pacifica · lighthouse_wide | 17.9 / 52.6 / 27.5 / 2.45 | 18.3 / 54.1 / 18.7 / 2.24 | 92 → 91 |
| Pacifica · tunnel_mouth | 18.2 / 53.5 / 19.1 / 2.63 | 17.9 / 53.2 / 19.7 / 2.26 | 110 → 110 |
| Pacifica · ocean_low | 17.8 / 53.5 / 18.8 / 2.36 | 17.7 / 53.2 / 19.2 / 2.72 | 96 → 94 |
| Pacifica · festival_finish | 18.1 / 50.0 / 20.2 / 2.76 | 18.2 / 51.5 / 19.5 / 2.82 | 193 → 193 |
| Pacifica · lighthouse_run (moving) | 17.8 / 54.9 / 19.5 / 2.57 | 18.2 / 52.6 / 19.0 / 2.47 | 78 → 78 |
| Mojave · open_desert | 18.1 / 53.2 / 18.9 / 2.52 | 18.2 / 52.9 / 19.1 / 2.59 | 130 → 130 |
| Mojave · rock_arch | 18.2 / 54.1 / 19.2 / 2.60 | 18.1 / 53.2 / 20.0 / 2.55 | 108 → 108 |
| Mojave · mesa_vista | 18.1 / 52.4 / 19.2 / 2.20 | 17.8 / 52.9 / 19.3 / 2.56 | 78 → 78 |
| Mojave · mine_camp | 18.2 / 52.9 / 19.0 / 2.91 | 17.8 / 54.1 / 18.6 / 2.87 | 185 → 185 |
| Mojave · gas_diner | 18.0 / 53.5 / 19.0 / 2.54 | 17.8 / 54.6 / 18.5 / 2.59 | 106 → 106 |
| Mojave · arch_run (moving) | 18.6 / 51.8 / 19.3 / 2.37 | 18.3 / 52.1 / 19.4 / 2.57 | 110 → 110 |

Reading: **Pacifica and Mojave did not get slower** (they were not the Phase 4 targets; the only change that
touches them is the scatter scale fix). The Phase 3 29 ms / 27.5 ms worst frames in the first two
Pacifica shots are one-off hitches in that single run; I would not claim Phase 4 fixed them from one run.

### Alondra: legacy vs V2 (Phase 4), same build, same pane

| shot | legacy p95 / 1 % low / worst / CPU · draws · tris | **V2** p95 / 1 % low / worst / CPU · draws · tris |
|---|---|---|
| commercial_strip | 18.7 / 49.5 / 25.9 / 3.15 · 256 · 500k | 19.0 / 48.1 / 21.0 / **2.67** · **217** · 567k |
| dense_intersection | 18.1 / 50.8 / 20.7 / 3.44 · 224 · 432k | 19.2 / 49.3 / 20.3 / **2.62** · **179** · 469k |
| residential_sweep | 18.3 / 51.5 / 20.0 / 3.09 · 248 · 529k | 19.2 / 49.3 / 20.7 / **2.50** · **188** · 592k |
| police_lot | 18.0 / 51.5 / 19.5 / 3.29 · 216 · 436k | 19.1 / 49.0 / 20.5 / **2.68** · **175** · 507k |
| **hot_block (stress)** | 18.7 / 50.3 / 20.1 / 3.02 · 315 · 572k | 19.0 / 49.3 / 20.7 / **2.66** · **235** · 536k |
| boulevard_run (moving) | 18.3 / 52.9 / 18.9 / 3.22 · 231 · 554k | 19.3 / 48.3 / 20.7 / **2.63** · **182** · 642k |

V2 Alondra renders the full post chain (GTAO, bloom, haze, grade), physical shop glass, detail shaders,
wall art and 344 instanced props, with **~20 % fewer draw calls and ~17 % less CPU submit time than
legacy**, at ~+1 ms p95 (GPU cost of the post chain). All shots hold 60 fps with p95 ≤ 19.3 ms: inside the
brief's desktop target (moving p95 ≤ 20–22 ms).

### Not measured on the M4 (and why)

- **Revolution:** an account track; the benchmark (correctly) waits for a signed-in racer, and the
  raw.githack origin in the pane is not signed in. Container counters only (below).
- **High, Ultra and mobile-Medium on the M4:** the High run was interrupted twice: the game paused when
  the window lost focus (now fixed: the benchmark ignores blur-pause), then the pane was hidden (a hidden
  pane renders no frames). To be re-run: `?bench=alondra&tier=high`, `...&tier=medium&mobile=1`, and the
  same for `pacifica`, `mojave`, `revolution` (signed in).
- **A real phone** was not available. The mobile numbers are the desktop GPU with the mobile preset.

## Container counters (SwiftShader: counts are valid, times are not)

Alondra, Medium: see `19-alondra-v2.md` (merge: 289 → 222 draws at the commercial strip, 371 → 257 at the
Hot Block). Revolution, Medium: see `21-revolution-v2.md` and `phase4_bench/`.

Presets (4J), stress shot per track, draws · triangles:

| track · shot | Low | Medium | mobile Medium | High |
|---|---|---|---|---|
| Pacifica · festival_finish | – | 220 · 487k | 217 · 480k | 222 · 501k |
| Mojave · mine_camp | – | 202 · 450k | 198 · 448k | 203 · 451k |
| Alondra · hot_block | 239 · 566k | 257 · 588k | 250 · 579k | – |
| Revolution · yorktown_wide | 254 · 552k | 412 · 1.03M | 409 · 1.03M | – |

Reading: **mobile Medium is barely lighter than desktop Medium in geometry** (it saves GTAO, MSAA samples and
shadow resolution, i.e. GPU fill, not draws). For Revolution on phones that is the risk: ~410 draws and 1M
triangles at Yorktown. Phase 5 should give `v2mobile` a shorter fog / cull distance (the Low preset's
0.55× fog already brings Yorktown to 254 draws) once a real phone has been measured. The identity is the
same on every preset (same look, same chapter colours); Low loses only the post-chain grade.

## Loading and first-frame hitching (4I)

Every V2 track runs `GFX.renderer.prewarm` before the lights go green: all programs compiled with
`compileAsync` (parallel where `KHR_parallel_shader_compile` exists) and one 1-px frame renders every
material once so textures upload before the race. Revolution additionally bakes its 7 chapter PMREMs at
load, so no environment is generated while racing (the switch between chapters is a pointer swap).
Container (SwiftShader, worst case) prewarm: Alondra 97 programs, Revolution 98.
