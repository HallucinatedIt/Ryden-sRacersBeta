# Phase 2 · Performance comparison (Pacifica + GT40 benchmark)

Same benchmark (`?bench=pacifica`), same shots, same resolution. Measured in the cloud test harness
(software GPU, 960×540 at pixel ratio 1; Low renders at 0.75). **Frame times from the software GPU
are not meaningful** (they are dominated by CPU rasterisation and by other jobs on the machine), so the
comparison below uses the workload counters. The real frame time comes from running the benchmark on
your devices (see "Real devices" below).

Counting note: from Phase 2 on, draw calls are counted per frame across every pass: shadow map, scene,
and post. Phase 1's table (04 · Benchmark) counted the scene pass only. Its numbers (54 / 54 / 73 / 57 /
147 / 45) are the **scene** column below, and they are identical, which confirms parity.

## BEFORE vs AFTER (Medium)

| shot | pipeline | total draws | scene | shadow | post passes | triangles (all passes) | shadow tris |
|---|---|---|---|---|---|---|---|
| cliff_lighthouse | OLD r128 | 82 | 54 | 28 | 0 | 351k | 83k |
| | legacy on r186 | 82 | 54 | 28 | 0 | 351k | 83k |
| | **Graphics V2** | 101 | 66 | 23 | 12 | **305k** | 83k |
| lighthouse_wide | OLD r128 | 77 | 54 | 23 | 0 | 351k | 83k |
| | **Graphics V2** | 100 | 65 | 23 | 12 | **299k** | 83k |
| tunnel_mouth | OLD r128 | 95 | 73 | 22 | 0 | 353k | 84k |
| | **Graphics V2** | 121 | 90 | 19 | 12 | **327k** | 83k |
| ocean_low | OLD r128 | 85 | 57 | 28 | 0 | 349k | 83k |
| | **Graphics V2** | 108 | 64 | 32 | 12 | **317k** | 97k |
| festival_finish | OLD r128 | 204 | 147 | 57 | 0 | 405k | 105k |
| | **Graphics V2** | 243 | 172 | 59 | 12 | 452k | 130k |
| lighthouse_run (moving) | OLD r128 | 73 | 45 | 28 | 0 | 351k | 86k |
| | **Graphics V2** | 99 | 59 | 28 | 12 | **304k** | 86k |

| | OLD | Graphics V2 (Medium) |
|---|---|---|
| texture memory (estimate) | 83.8 MB (r128) / 87.6 MB (r186) | **63.3 MB** (KTX2 environment + props; includes the new detail and decal textures) |
| environment download | 11.8 MB | **9.2 MB** (+3.4 MB for the three dressing props) |
| materials / shader programs | 95 / 28–30 | 103 / 42–46 |
| lights | 2 (sun + hemisphere) | 2 (sun + hemisphere at 0; sky light is image-based) |
| resolution / pixel ratio | 960×540 @1 | 960×540 @1 |

Where the V2 numbers come from:
- **+10–25 scene draws**: 40 scenery chunks instead of 4 merged meshes (in view: about +8), decals (+2),
  sky dome, ocean, dressing props (at the festival: the Corvette and trash cans, +6 with LODs).
- **−5 to +4 shadow draws**, and on the open road **the same shadow triangles**, even though the shadow
  box is sharper (2048² over ±55 m instead of 1024² over ±70 m): only chunks inside the box are drawn
  into it. The festival shot gains 25k shadow triangles from the Corvette.
- **−13 % triangles** on the open road (culled far chunks), +12 % at the festival (the props).
- **12 post passes**: 9 of them are at ¼ resolution or less (see 12 · Post-processing).

## Tier workloads (Graphics V2)

| tier | pixel ratio | shadows | post | draws (cliff shot) | triangles | notes |
|---|---|---|---|---|---|---|
| Low | 0.75 | 1024², ±38 m | off (direct render) | 83 | 301k | no AO/bloom/haze pass; linear fog; dynamic resolution on touch devices |
| Medium | 1.0 | 2048², ±55 m | MSAA4, GTAO 8, bloom, haze, grade | 101 | 305k | |
| High | 1.5 | 2048², ±70 m | GTAO 12 | 108 | 306k | +6 shadow draws (larger shadow box) |
| Ultra | 2.0 | 4096², ±90 m | GTAO 16, scenery zones 40 % further | 112 | 307k | festival: 262 draws (more chunks and props in range) |
| phone variant (Medium on a touch device) | 1.0 | 1024², ±45 m | MSAA ×2, **no GTAO**, bloom, haze, grade; dynamic resolution | | | `v2mobile` in settings.js; High on a phone: pr 1.25, GTAO 8 |

The harness runs at a device pixel ratio of 1, so High and Ultra render the same number of pixels as
Medium there. On a Retina Mac, High renders 1.5× and Ultra 2× the resolution per axis. Pixel work is
where their real cost is, and the counters above do not show it.

Full results: `docs/graphics-v2/phase2_bench/*.json`.

## Real devices

**Apple M4 MacBook Air, Phase 1 (OLD, r128), Medium, 982×671 @1×**, measured in the Claude desktop
app's browser: **60 fps (vsync-locked) in every shot, p95 18.2–18.7 ms, 1 % low 52–53 fps, CPU submit
1.7–2.5 ms** (`phase2_bench/m4_phase1_medium_legacy.json`). The M4 has plenty of headroom at Medium.

The Graphics V2 run on the same Mac did not finish: the browser pane was hidden, which pauses the
render loop. **To get the V2 numbers, open these on the Mac and on your phone, let each finish (about
30 s), and download the JSON from the panel:**

- OLD: `https://raw.githack.com/HallucinatedIt/Ryden-sRacersBeta/graphics-v2/index.html?bench=pacifica&gfx=legacy&tier=medium`
- V2: `https://raw.githack.com/HallucinatedIt/Ryden-sRacersBeta/graphics-v2/index.html?bench=pacifica&tier=medium`
- then `&tier=high`, `&tier=low` on the phone.

The panel shows OLD and V2 side by side once both have run on the same device.

## Regression rule and what to do if a device is slow

Every expensive feature is one tier switch: `ssao` (the biggest), `msaa`, `bloom`, `postFX` (drops to
the direct path), `shadowSize` / `shadowDistance`, `pr`. Low has none of the post stages and uses
dynamic resolution on phones. If Medium is below 60 fps on the target phone, the first step is to move
the phone's default to Low (`GFX.settings.recommended()` is ready but not applied automatically).
